const readline = require("readline");
const cmds = require("./cmds");
const { colorize, log, biglog, errorlog } = require("./out");

biglog("CORE Quiz", "green");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: colorize("quiz > ", "blue"),
  completer: (line) => {
    const completions = "h help list show add delete edit test p play credits q quit".split(' ');
    const hits = completions.filter((c) => c.startsWith(line));
    return [hits.length ? hits : completions, line];
  }
});

rl.prompt();

rl.on('line', (line) => {

  let args = line.split(" ");
  let cmd = args[0].toLowerCase().trim();

  switch (cmd) {
    case "":
      break;
    case "h":
    case "help":
      cmds.helpCmd(rl);
      break;
    case "list":
      cmds.listCmd(rl);
      break;
    case "show":
      cmds.showCmd(rl, args[1]);
      break;
    case "add":
      cmds.addCmd(rl, args[1]);
      break;
    case "delete":
      cmds.deleteCmd(rl, args[1]);
      break;
    case "edit":
      cmds.editCmd(rl, args[1]);
      break;
    case "test":
      cmds.testCmd(rl, args[1]);
      break;
    case "p":
    case "play":
      cmds.playCmd(rl);
      break;
    case "credits":
      cmds.creditsCmd(rl);
      break;
    case "q":
    case "quit":
      cmds.quitCmd(rl);
      break;
    default:
      log(`Comando desconocido: "${colorize(cmd, "red")}"`);
      log(`Use ${colorize("help", "green")} para ver todos los comandos disponibles.`)
      break;
  }

}).on('close', () => {
  biglog("Sayonara baby", "red");
  process.exit(0);
});