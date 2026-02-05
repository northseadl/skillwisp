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
 * 递归扫描目录，查找所有 SKILL.md 文件
 */
function findSkillFiles(dir) {
    const results = [];

    if (!fs.existsSync(dir)) {
        return results;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            results.push(...findSkillFiles(fullPath));
        } else if (entry.name === 'SKILL.md') {
            results.push(fullPath);
        }
    }

    return results;
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
    const skillFiles = findSkillFiles(SKILLS_DIR);
    const statsBySource = {};

    for (const filePath of skillFiles) {
        // 解析路径：skills/@source/skill-id/SKILL.md
        const relativePath = path.relative(SKILLS_DIR, filePath);
        const parts = relativePath.split(path.sep);

        if (parts.length >= 2) {
            const source = parts[0].replace('@', '');
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
    }

    return statsBySource;
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
 * 解析 index.yaml 获取已注册的技能（使用 path 匹配目录）
 */
function parseIndex(filePath) {
    if (!fs.existsSync(filePath)) {
        return {};
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const skills = {};

    // 匹配 path 字段: path: "@source/skill-id"
    const pathMatches = content.matchAll(/path:\s*["']?@([^\/]+)\/([^"'\n]+)["']?/g);

    for (const match of pathMatches) {
        const source = match[1].trim();
        const skillId = match[2].trim();

        if (!skills[source]) {
            skills[source] = [];
        }
        skills[source].push(skillId);
    }

    return skills;
}

/**
 * 验证翻译覆盖
 */
function verifyTranslations(statsBySource, cliRegistryPath) {
    const i18nPath = path.join(cliRegistryPath, 'i18n', 'zh-CN.yaml');
    const indexPath = path.join(cliRegistryPath, 'index.yaml');

    const translations = parseTranslations(i18nPath);
    const indexSkills = parseIndex(indexPath);

    const missing = [];
    const orphaned = [];

    // 检查目录中的技能是否都有翻译
    for (const [source, skills] of Object.entries(statsBySource)) {
        for (const skill of skills) {
            const hasTranslation = translations[source] && translations[source][skill.id];
            const inIndex = indexSkills[source] && indexSkills[source].includes(skill.id);

            if (!hasTranslation) {
                missing.push({ source, id: skill.id, type: 'translation' });
            }
            if (!inIndex) {
                missing.push({ source, id: skill.id, type: 'index' });
            }
        }
    }

    // 检查翻译中是否有孤立条目（目录中不存在）
    for (const [source, skillIds] of Object.entries(translations)) {
        for (const skillId of Object.keys(skillIds)) {
            const existsInDir = statsBySource[source] &&
                statsBySource[source].some(s => s.id === skillId);
            if (!existsInDir) {
                orphaned.push({ source, id: skillId, type: 'translation' });
            }
        }
    }

    return { missing, orphaned, translations, indexSkills };
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
    const statsBySource = collectStats();
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
        const { missing, orphaned, translations, indexSkills } = verifyTranslations(statsBySource, cliRegistryPath);

        // 统计翻译和索引覆盖
        let translationCount = 0;
        let indexCount = 0;

        for (const source of Object.keys(translations)) {
            translationCount += Object.keys(translations[source]).length;
        }
        for (const source of Object.keys(indexSkills)) {
            indexCount += indexSkills[source].length;
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

                if (missingIndex.length > 0) {
                    log(`  index.yaml: ${missingIndex.map(m => `@${m.source}/${m.id}`).join(', ')}`, 'yellow');
                }
                if (missingI18n.length > 0) {
                    log(`  zh-CN.yaml: ${missingI18n.map(m => `@${m.source}/${m.id}`).join(', ')}`, 'yellow');
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

