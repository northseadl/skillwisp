#!/usr/bin/env node
/**
 * sync-stats.js - 自动同步 Skills 统计数据
 * 
 * 功能：
 * 1. 扫描 skills/ 目录统计技能数量
 * 2. 更新 README.md 和 docs/skills.md 中的统计数字
 * 3. 输出统计报告
 * 
 * 用法：
 *   node scripts/sync-stats.js        # 输出统计，不修改文件
 *   node scripts/sync-stats.js --fix  # 输出统计并更新文件
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const SKILLS_DIR = path.join(ROOT_DIR, 'skills');
const README_PATH = path.join(ROOT_DIR, 'README.md');
const SKILLS_MD_PATH = path.join(ROOT_DIR, 'docs', 'skills.md');

// ANSI colors
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    red: '\x1b[31m',
    dim: '\x1b[2m',
};

function log(msg, color = 'reset') {
    console.log(`${colors[color]}${msg}${colors.reset}`);
}

/**
 * 仅扫描一级 skill 目录（避免把嵌套的文档/示例误判为 skill）
 *
 * 结构约定：
 *   skills/@source/<skill-id>/SKILL.md
 */
function scanSkillDirs(skillsDir) {
    const results = [];
    const broken = [];

    if (!fs.existsSync(skillsDir)) {
        return { results, broken };
    }

    const sourceEntries = fs.readdirSync(skillsDir, { withFileTypes: true });
    for (const sourceEntry of sourceEntries) {
        if (!sourceEntry.isDirectory()) continue;
        if (!sourceEntry.name.startsWith('@')) continue;

        const sourceDir = path.join(skillsDir, sourceEntry.name);
        const skillEntries = fs.readdirSync(sourceDir, { withFileTypes: true });

        for (const skillEntry of skillEntries) {
            if (!skillEntry.isDirectory()) continue;

            const skillDir = path.join(sourceDir, skillEntry.name);
            const entryPath = path.join(skillDir, 'SKILL.md');

            if (!fs.existsSync(entryPath)) {
                broken.push({
                    source: sourceEntry.name.slice(1),
                    id: skillEntry.name,
                    dir: skillDir,
                });
                continue;
            }

            results.push(entryPath);
        }
    }

    return { results, broken };
}

/**
 * 解析 SKILL.md 的 frontmatter 获取技能信息
 */
function parseSkillMetadata(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const match = content.match(/^---\n([\s\S]*?)\n---/);

    if (!match) {
        return { name: path.basename(path.dirname(filePath)), description: '' };
    }

    const frontmatter = match[1];
    const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
    const descMatch = frontmatter.match(/^description:\s*["']?(.+?)["']?\s*$/m);

    return {
        name: nameMatch ? nameMatch[1].trim() : path.basename(path.dirname(filePath)),
        description: descMatch ? descMatch[1].trim() : '',
    };
}

/**
 * 统计各来源的技能数量
 */
function collectStats() {
    const { results: skillFiles, broken } = scanSkillDirs(SKILLS_DIR);
    const statsBySource = {};

    for (const filePath of skillFiles) {
        // 解析路径：skills/@source/skill-id/SKILL.md
        const relativePath = path.relative(SKILLS_DIR, filePath);
        const parts = relativePath.split(path.sep);

        if (parts.length !== 3) continue;
        if (!parts[0].startsWith('@')) continue;
        if (parts[2] !== 'SKILL.md') continue;

        const source = parts[0].slice(1);
        const skillId = parts[1];

        if (!statsBySource[source]) {
            statsBySource[source] = [];
        }

        statsBySource[source].push({
            id: skillId,
            path: filePath,
            ...parseSkillMetadata(filePath),
        });
    }

    return { statsBySource, broken };
}

/**
 * 更新文件中的统计数字
 */
function updateStatsInFile(filePath, totalCount, sourceCount) {
    if (!fs.existsSync(filePath)) {
        log(`  ⚠ File not found: ${filePath}`, 'yellow');
        return false;
    }

    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;

    // 更新 "共 X 个 Skills" 格式
    const skillCountPattern = /共\s*(\d+)\s*个\s*Skills/g;
    content = content.replace(skillCountPattern, (match, num) => {
        if (parseInt(num) !== totalCount) {
            modified = true;
            return `共 ${totalCount} 个 Skills`;
        }
        return match;
    });

    // 更新 "来自 X 个源" 格式
    const sourceCountPattern = /来自\s*(\d+)\s*个源/g;
    content = content.replace(sourceCountPattern, (match, num) => {
        if (parseInt(num) !== sourceCount) {
            modified = true;
            return `来自 ${sourceCount} 个源`;
        }
        return match;
    });

    // 更新 "**X 个 Skills**" 格式
    const boldCountPattern = /\*\*(\d+)\s*个\s*Skills\*\*/g;
    content = content.replace(boldCountPattern, (match, num) => {
        if (parseInt(num) !== totalCount) {
            modified = true;
            return `**${totalCount} 个 Skills**`;
        }
        return match;
    });

    // 更新 "查看全部 X 个 Skills" 格式
    const viewAllPattern = /查看全部\s*(\d+)\s*个\s*Skills/g;
    content = content.replace(viewAllPattern, (match, num) => {
        if (parseInt(num) !== totalCount) {
            modified = true;
            return `查看全部 ${totalCount} 个 Skills`;
        }
        return match;
    });

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf-8');
        return true;
    }

    return false;
}

/**
 * 解析 YAML 文件获取翻译条目
 */
function parseTranslations(filePath) {
    if (!fs.existsSync(filePath)) {
        return {};
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const translations = {};

    // 简单解析 YAML 结构: source -> skill-id -> {name, description}
    let currentSource = null;
    let currentSkill = null;

    const lines = content.split('\n');
    for (const line of lines) {
        // Source level: "  anthropic:"
        const sourceMatch = line.match(/^  ([a-z][a-z0-9-]*):$/);
        if (sourceMatch) {
            currentSource = sourceMatch[1];
            translations[currentSource] = {};
            continue;
        }

        // Skill level: "    pdf:" or "    claude.ai:"
        const skillMatch = line.match(/^    ([a-z][a-z0-9.-]*):$/);
        if (skillMatch && currentSource) {
            currentSkill = skillMatch[1];
            translations[currentSource][currentSkill] = {};
            continue;
        }
    }

    return translations;
}

/**
 * 解析 index.yaml 获取已注册的技能（提取 id/source/path）
 */
function parseIndex(filePath) {
    if (!fs.existsSync(filePath)) {
        return {};
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    const entries = [];
    let current = null;

    const unquote = (value) => {
        let v = String(value).trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
            v = v.slice(1, -1);
        }
        return v;
    };

    for (const line of lines) {
        const idMatch = line.match(/^\s*-\s*id:\s*(.+)\s*$/);
        if (idMatch) {
            if (current && current.id && current.source && current.path) {
                entries.push(current);
            }
            current = { id: unquote(idMatch[1]), source: '', path: '' };
            continue;
        }

        if (!current) continue;

        const sourceMatch = line.match(/^\s*source:\s*(.+)\s*$/);
        if (sourceMatch) {
            current.source = unquote(sourceMatch[1]);
            continue;
        }

        const pathMatch = line.match(/^\s*path:\s*(.+)\s*$/);
        if (pathMatch) {
            current.path = unquote(pathMatch[1]);
            continue;
        }
    }

    if (current && current.id && current.source && current.path) {
        entries.push(current);
    }

    const bySource = {};
    const byPath = {};

    for (const e of entries) {
        if (!bySource[e.source]) bySource[e.source] = [];
        bySource[e.source].push(e);
        byPath[e.path] = e;
    }

    return { entries, bySource, byPath };
}

/**
 * 验证翻译覆盖
 */
function verifyTranslations(statsBySource, broken, cliRegistryPath) {
    const i18nPath = path.join(cliRegistryPath, 'i18n', 'zh-CN.yaml');
    const indexPath = path.join(cliRegistryPath, 'index.yaml');

    const translations = parseTranslations(i18nPath);
    const index = parseIndex(indexPath);
    const indexEntries = index.entries || [];
    const indexBySource = index.bySource || {};
    const indexByPath = index.byPath || {};

    const missing = [];
    const orphaned = [];

    // 1) 目录扫描：每个目录应在 index.yaml 有一条 path，并且 translation 以 index.id 为 key
    for (const [source, skills] of Object.entries(statsBySource)) {
        for (const skill of skills) {
            const expectedPath = `@${source}/${skill.id}`;
            const indexEntry = indexByPath[expectedPath];

            if (!indexEntry) {
                missing.push({ source, id: skill.id, type: 'index', path: expectedPath });
                continue;
            }

            const hasTranslation = translations[source] && translations[source][indexEntry.id];
            if (!hasTranslation) {
                missing.push({ source, id: indexEntry.id, type: 'translation', path: expectedPath });
            }
        }
    }

    // 2) Index 反向校验：每个 index entry 的 path 对应目录必须存在 SKILL.md
    for (const entry of indexEntries) {
        const entryFile = path.join(SKILLS_DIR, entry.path, 'SKILL.md');
        if (!fs.existsSync(entryFile)) {
            missing.push({ source: entry.source, id: entry.id, type: 'skillDir', path: entry.path });
        }
    }

    // 3) 翻译孤儿：translation 中存在但 index 中没有的 id
    for (const [source, skillIds] of Object.entries(translations)) {
        const valid = new Set((indexBySource[source] || []).map((e) => e.id));
        for (const id of Object.keys(skillIds)) {
            if (!valid.has(id)) {
                orphaned.push({ source, id, type: 'translation' });
            }
        }
    }

    // 4) 结构损坏：存在目录但缺少 SKILL.md（无法计入统计）
    for (const item of broken || []) {
        missing.push({ source: item.source, id: item.id, type: 'missingSkillMd' });
    }

    return { missing, orphaned, translations, indexEntries };
}

/**
 * 主函数
 */
function main() {
    const args = process.argv.slice(2);
    const shouldFix = args.includes('--fix');
    const checkI18n = args.includes('--i18n') || args.includes('--all');

    log('\n📊 SkillWisp Stats Sync\n', 'cyan');

    // 收集统计数据
    const { statsBySource, broken } = collectStats();
    const sources = Object.keys(statsBySource).sort();
    const sourceCount = sources.length;

    let totalCount = 0;

    log('Skills by Source:', 'green');
    log('─'.repeat(40), 'dim');

    for (const source of sources) {
        const skills = statsBySource[source];
        totalCount += skills.length;
        log(`  @${source.padEnd(20)} ${String(skills.length).padStart(3)} skills`, 'reset');
    }

    log('─'.repeat(40), 'dim');
    log(`  ${'Total'.padEnd(20)} ${String(totalCount).padStart(3)} skills`, 'green');
    log(`  ${'Sources'.padEnd(20)} ${String(sourceCount).padStart(3)} sources\n`, 'green');

    // 翻译和索引验证
    const cliRegistryPath = path.join(ROOT_DIR, '..', 'skillwisp-cli', 'registry');

    if (fs.existsSync(cliRegistryPath)) {
        const { missing, orphaned, translations, indexEntries } = verifyTranslations(statsBySource, broken, cliRegistryPath);

        // 统计翻译和索引覆盖
        let translationCount = 0;
        const indexCount = indexEntries.length;

        for (const source of Object.keys(translations)) {
            translationCount += Object.keys(translations[source]).length;
        }

        log('Registry Status:', 'cyan');
        log('─'.repeat(40), 'dim');
        log(`  ${'index.yaml'.padEnd(20)} ${String(indexCount).padStart(3)} entries`, indexCount === totalCount ? 'green' : 'yellow');
        log(`  ${'zh-CN.yaml'.padEnd(20)} ${String(translationCount).padStart(3)} entries`, translationCount === totalCount ? 'green' : 'yellow');
        log('─'.repeat(40), 'dim');

        if (missing.length > 0 || orphaned.length > 0) {
            log('');

            if (missing.length > 0) {
                log('⚠ Missing entries:', 'yellow');
                const missingIndex = missing.filter(m => m.type === 'index');
                const missingI18n = missing.filter(m => m.type === 'translation');
                const missingDir = missing.filter(m => m.type === 'skillDir' || m.type === 'missingSkillMd');

                if (missingIndex.length > 0) {
                    log(`  index.yaml: ${missingIndex.map(m => m.path || `@${m.source}/${m.id}`).join(', ')}`, 'yellow');
                }
                if (missingI18n.length > 0) {
                    log(`  zh-CN.yaml: ${missingI18n.map(m => `@${m.source}/${m.id}`).join(', ')}`, 'yellow');
                }
                if (missingDir.length > 0) {
                    log(`  skills/: ${missingDir.map(m => m.path ? `${m.path}` : `@${m.source}/${m.id}`).join(', ')}`, 'yellow');
                }
            }

            if (orphaned.length > 0) {
                log('⚠ Orphaned entries (in registry but not in skills/):', 'yellow');
                for (const item of orphaned) {
                    log(`  @${item.source}/${item.id}`, 'yellow');
                }
            }
            log('');
        } else {
            log('  ✓ All skills registered and translated\n', 'green');
        }
    }

    if (!shouldFix) {
        log('Run with --fix to update documentation files.\n', 'dim');
        return;
    }

    // 更新文档文件
    log('Updating documentation...', 'cyan');

    const files = [README_PATH, SKILLS_MD_PATH];

    for (const file of files) {
        const relativePath = path.relative(ROOT_DIR, file);
        const updated = updateStatsInFile(file, totalCount, sourceCount);

        if (updated) {
            log(`  ✓ Updated: ${relativePath}`, 'green');
        } else {
            log(`  ○ No changes: ${relativePath}`, 'dim');
        }
    }

    log('\n✅ Sync complete!\n', 'green');
}

main();
