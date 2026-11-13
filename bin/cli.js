#!/usr/bin/env node
/**
 * diagram-design skill 安装器
 *
 * 用法（npx 免安装，@latest 保证每次拉最新版）:
 *   npx -y @czasg/diagram-design@latest install             # 安装/更新 = 同一条命令
 *   npx -y @czasg/diagram-design@latest install --only claude
 *   npx -y @czasg/diagram-design@latest install --dry-run   # 只预览，不写文件
 *   npx -y @czasg/diagram-design@latest uninstall           # 从所有目标移除
 *   npx -y @czasg/diagram-design@latest list                # 查看各目标安装状态
 *
 * 目标目录（没有 ~/.claude / ~/.codex 的目标自动跳过，不代建）:
 *   ~/.claude/skills/diagram-design
 *   ~/.codex/skills/diagram-design
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const SKILL_NAME = 'diagram-design';
// 随包分发的 skill 载荷（与 package.json 的 files 字段对应）
const PAYLOAD = ['SKILL.md', 'scripts', 'references', 'assets'];

const TARGETS = [
  { id: 'claude', label: 'Claude Code', dir: path.join(os.homedir(), '.claude', 'skills', SKILL_NAME) },
  { id: 'codex', label: 'Codex', dir: path.join(os.homedir(), '.codex', 'skills', SKILL_NAME) },
];

const PKG_ROOT = path.join(__dirname, '..');

function fail(msg) {
  console.error(`错误: ${msg}`);
  process.exit(1);
}

function parseArgs(argv) {
  const args = { cmd: null, only: null, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--only') {
      args.only = argv[++i];
      if (!args.only) fail('--only 需要参数 (claude | codex)');
    } else if (!args.cmd) args.cmd = a;
    else fail(`未知参数: ${a}`);
  }
  return args;
}

function selectTargets(only) {
  if (!only) return TARGETS;
  const hit = TARGETS.filter((t) => t.id === only);
  if (!hit.length) fail(`未知目标 "${only}"，可选: ${TARGETS.map((t) => t.id).join(' | ')}`);
  return hit;
}

function checkPayload() {
  const missing = PAYLOAD.filter((p) => !fs.existsSync(path.join(PKG_ROOT, p)));
  if (missing.length) fail(`包内缺少文件: ${missing.join(', ')}`);
}

function skillsRoot(t) {
  return path.dirname(t.dir); // ~/.claude/skills / ~/.codex/skills
}

function appRoot(t) {
  return path.dirname(skillsRoot(t)); // ~/.claude / ~/.codex —— 有没有装这个工具看它
}

function install(targets, dryRun) {
  checkPayload();
  // 没有 ~/.claude / ~/.codex = 用户没装这个工具，跳过而不是替他建出来
  const skipped = targets.filter((t) => !fs.existsSync(appRoot(t)));
  const selected = targets.filter((t) => fs.existsSync(appRoot(t)));
  for (const t of skipped) console.log(`跳过 ${t.label}: ${appRoot(t)} 不存在`);
  if (!selected.length) {
    const why = skipped.length ? `（${skipped.map((t) => t.label).join(', ')} 不存在）` : '';
    fail(`没有可安装的目标${why}`);
  }

  for (const t of selected) {
    if (dryRun) {
      console.log(`[dry-run] ${t.label}: ${t.dir}`);
      for (const p of PAYLOAD) console.log(`[dry-run]   <- ${p}`);
      continue;
    }
    fs.mkdirSync(skillsRoot(t), { recursive: true });
    fs.rmSync(t.dir, { recursive: true, force: true }); // 全量替换，避免残留旧文件
    fs.mkdirSync(t.dir, { recursive: true });
    for (const p of PAYLOAD) {
      fs.cpSync(path.join(PKG_ROOT, p), path.join(t.dir, p), { recursive: true });
    }
    console.log(`已安装 ${t.label}: ${t.dir}`);
  }
}

function uninstall(targets, dryRun) {
  for (const t of targets) {
    if (!fs.existsSync(t.dir)) {
      console.log(`${t.label}: 未安装，跳过`);
      continue;
    }
    if (dryRun) {
      console.log(`[dry-run] ${t.label}: 将删除 ${t.dir}`);
      continue;
    }
    fs.rmSync(t.dir, { recursive: true, force: true });
    console.log(`已移除 ${t.label}: ${t.dir}`);
  }
}

function list(targets) {
  for (const t of targets) {
    if (!fs.existsSync(appRoot(t))) {
      console.log(`- ${t.label.padEnd(12)} ${appRoot(t)} 不存在（未安装该工具）`);
      continue;
    }
    const ok = fs.existsSync(path.join(t.dir, 'SKILL.md'));
    console.log(`${ok ? '✓' : '✗'} ${t.label.padEnd(12)} ${t.dir}`);
  }
}

function help() {
  console.log(`用法（npx，无需全局安装；安装与更新为同一条命令）:
  npx -y @czasg/diagram-design@latest install [--only claude|codex] [--dry-run]
  npx -y @czasg/diagram-design@latest uninstall [--only claude|codex]
  npx -y @czasg/diagram-design@latest list`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const targets = selectTargets(args.only);
  switch (args.cmd) {
    case 'install':
      return install(targets, args.dryRun);
    case 'uninstall':
      return uninstall(targets, args.dryRun);
    case 'list':
      return list(targets);
    case null:
    case undefined:
      return help();
    default:
      fail(`未知命令: ${args.cmd}`);
  }
}

main();
