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
 * 主函数
 */
function main() {
    const args = process.argv.slice(2);
    const shouldFix = args.includes('--fix');

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
