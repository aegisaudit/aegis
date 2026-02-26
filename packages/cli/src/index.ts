import { Command } from 'commander';
import { registerAuditorCmd } from './commands/register-auditor.js';
import { registerSkillCmd } from './commands/register-skill.js';
import { verifyCmd } from './commands/verify.js';
import { statusCmd } from './commands/status.js';
import { deployCmd } from './commands/deploy.js';

const program = new Command();

program
  .name('aegis')
  .description('AEGIS Protocol CLI — Anonymous Expertise & Guarantee for Intelligent Skills')
  .version('0.0.1');

program.addCommand(registerAuditorCmd);
program.addCommand(registerSkillCmd);
program.addCommand(verifyCmd);
program.addCommand(statusCmd);
program.addCommand(deployCmd);

program.parse();
