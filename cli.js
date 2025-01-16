import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { Command } from 'commander'
import inquirer from 'inquirer'
import simpleGit from 'simple-git'

const program = new Command()

program
  .version('1.0.0')
  .description('CLI for generating project templates')
  .action(() => {
    inquirer
      .prompt([
        {
          type: 'input',
          name: 'projectNameEN',
          message: '请输入项目英文名称:',
          validate: (input) => {
            if (!input) {
              return '项目英文名称不能为空'
            }
            return true
          },
        },
        {
          type: 'input',
          name: 'projectNameCN',
          message: '请输入项目中文名称:',
          validate: (input) => {
            if (!input) {
              return '项目中文名称不能为空'
            }
            return true
          },
        },
        {
          type: 'list',
          name: 'templateType',
          message: '请选择模板类型(ALL TS):',
          choices: ['VUE3', 'REACT19', 'NEXT'],
        },
        {
          type: 'input',
          name: 'newGitFolder',
          message: '请将新仓库.git文件夹拖动到此处(可选):',
        },
      ])
      .then(async (answers) => {
        const { projectNameEN, projectNameCN, templateType, newGitFolder } = answers
        if (!newGitFolder) {
          console.log('%c未选择新仓库.git', 'color: yellow')
        }
        const projectPath = path.join(process.cwd(), projectNameEN)
        if (!fs.existsSync(projectPath)) {
          fs.mkdirSync(projectPath)
          console.log(`项目 ${projectNameEN}(${projectNameCN})目录已创建，使用模板TS + ${templateType}`)
          console.log('\n')
          // 根据模板类型选择对应的 Git 仓库 URL
          const templateRepoUrl = {
            VUE3: 'git@github.com:LeonCry/vue-template.git',
            REACT19: 'https://github.com/LeonCry/react-template.git',
            NEXT: 'https://github.com/LeonCry/next-template.git',
          }[templateType]
          const git = simpleGit()
          try {
            console.log(`[1/7] 正在创建${templateType}模板...`)
            await git.clone(templateRepoUrl, projectPath)
            console.log('[2/7] 模板创建成功,正在修改配置...')
            await new Promise((resolve) => setTimeout(resolve, 500))
            const envLocalFilePath = path.join(projectPath, '.env.local')
            const textToAppend = `VITE_APP_ROUTER_PREFIX = '${projectNameEN}'\nVITE_APP_OUTPUT = './dist/${projectNameEN}'\nVITE_APP_TITLE_ZH='${projectNameCN}'\n`
            fs.writeFileSync(envLocalFilePath, `${textToAppend}`, 'utf8')
            console.log('[3/7] update .env.local success.')
            await new Promise((resolve) => setTimeout(resolve, 300))
            console.log('[4/7] update .env.dev|pre|prod success.')
            await new Promise((resolve) => setTimeout(resolve, 300))
            const packagePath = path.join(projectPath, 'package.json')
            const fileContent = fs.readFileSync(packagePath, 'utf8')
            const lines = fileContent.split('\n')
            lines.splice(1, 1)
            const newLine = `  "name": "${projectNameEN}",`
            lines.splice(1, 0, newLine)
            fs.writeFileSync(packagePath, lines.join('\n'), 'utf8')
            console.log('[5/7] update package.json success.')
            await new Promise((resolve) => setTimeout(resolve, 500))
            console.log('[6/7] del unused files...')
            await new Promise((resolve) => setTimeout(resolve, 800))
            const gitFolderPath = path.join(projectPath, '.git')
            fs.rmSync(gitFolderPath, { recursive: true, force: true })
            if (newGitFolder) {
              console.log('[6.5/7] move .git folder...')
              await new Promise((resolve) => setTimeout(resolve, 500))
              const newGitFolderPath = path.join(projectPath, path.basename(newGitFolder))
              fs.renameSync(newGitFolder, newGitFolderPath)
            }
            console.log('[7/7]正在安装依赖...')
            execSync('npm install --legacy-peer-deps', { cwd: projectPath, stdio: 'inherit' })
            console.log('\n---------------------\n')
            if (newGitFolder) console.log(`%c${'项目创建完成! 使用 `npm run dev` 启动项目'}`, 'color: green; font-weight: bold;')
            else console.log(`%c${'项目创建完成! 请将项目.git文件夹复制到下方目录地址中,然后使用 `npm run dev` 启动项目'}`, 'color: green; font-weight: bold;')
            console.log('\n')
            console.log(`%c${projectPath}`, 'color: blue; font-weight: bold;')
          } catch (error) {
            console.error('ERROR:', error)
          }
        } else {
          console.error('项目目录已存在，请选择其他名称。')
        }
      })
  })

program.parse(process.argv)
