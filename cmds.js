const model = require("./model");
const { colorize, log, biglog, errorlog } = require("./out");

exports.helpCmd = rl => {
  log("Commandos: ");
  log("h|help - Muestra esta ayuda.");
  log("list - Listar los quizzes existentes.");
  log("show <id> - Muestra la pregunta y la respuesta el quiz indicado.");
  log("add - Añadir un nuevo quiz interactivamente.");
  log("delete <id> - Borrar el quiz indicado.");
  log("edit <id> - Editar el quiz indicado.");
  log("test <id> - Probar el quiz indicado.");
  log("p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
  log("credits - Créditos.");
  log("q|quit - Salir del programa.");
  rl.prompt();
}

exports.listCmd = rl => {
  model.getAll().forEach((quiz, id) => {
    log(`[${colorize(id, "magenta")}]: ${quiz.question}`);
  });
  rl.prompt();
}

exports.showCmd = (rl, id) => {
  if (typeof id === "undefined") {
    errorlog(`Falta el parámetro id.`);
  } else {
    try {
      const quiz = model.getByIndex(id);
      log(`[${colorize(id, "magenta")}]: ${quiz.question} ${colorize("=>", "magenta")} ${quiz.answer}`);
    } catch (error) {
      errorlog(error.message);
    }
  }
  rl.prompt();
}

exports.addCmd = (rl, id) => {
  rl.question(colorize("Introduzca una pregunta: ", "red"), question => {
    rl.question(colorize("Introduzca la respuesta ", "red"), answer => {
      model.add(question, answer);
      log(`${colorize("Se ha añadido", "magenta")}: ${question} ${colorize("=>", "magenta")} ${answer}`);
      rl.prompt();
    });
  });
}

exports.deleteCmd = (rl, id) => {
  if (typeof id === "undefined") {
    errorlog(`Falta el parámetro id.`);
  } else {
    try {
      model.deleteByIndex(id);
    } catch (error) {
      errorlog(error.message);
    }
  }
  rl.prompt();
}

exports.editCmd = (rl, id) => {
  if (typeof id === "undefined") {
    errorlog(`Falta el parámetro id.`);
    rl.prompt();
  } else {
    try {
      const quiz = model.getByIndex(id);
      process.stdout.isTTY && setTimeout(() => { rl.write(quiz.question) }, 0);
      rl.question(colorize("Introduzca una pregunta: ", "red"), question => {
        process.stdout.isTTY && setTimeout(() => { rl.write(quiz.answer) }, 0);
        rl.question(colorize("Introduzca la respuesta ", "red"), answer => {
          model.update(id, question, answer);
          log(`Se ha cambiado el quiz ${colorize(id, "magenta")} por: ${question} ${colorize("=>", "magenta")} ${answer}`);
          rl.prompt();
        });
      });
    } catch (error) {
      errorlog(error.message);
      rl.prompt();
    }
  }
}

exports.testCmd = (rl, id) => {
  if (typeof id === "undefined") {
    errorlog(`Falta el parámetro id.`);
    rl.prompt();
  } else {
    try {
      const quiz = model.getByIndex(id);
      rl.question(colorize(quiz.question, "red"), ans => {
        if (ans.toLowerCase().trim() == quiz.answer.toLowerCase().trim()) {
          log("Su respuesta es:", "blue");
          log("correcta", "green");
          rl.prompt();
        } else {
          log("Su respuesta es:", "blue");
          log("incorrecta", "red");
          rl.prompt();
        }
      });
    } catch (error) {
      errorlog(error.message);
      rl.prompt();
    }
  }
}

exports.playCmd = rl => {
  let score = 0;
  let size = model.count();
  let toBeResolved = new Array(size);
  for (var x = 0; x < size; x++) {
    toBeResolved[x] = x;
  }
  const jugar = () => {
    if (toBeResolved.length <= 0) {
      biglog("¡Enhorabuena!", "green");
      log(`Fin. Has ganado. Preguntas acertadas: ${colorize(score, "yellow")}`, "green");
      rl.prompt();
    } else {
      let azar = Math.floor(Math.random() * toBeResolved.length);
      let id = toBeResolved[azar];
      toBeResolved.splice((toBeResolved.length - 1), 1);
      let quiz = model.getByIndex(id);
      model.deleteByIndex(id);
      rl.question(colorize(quiz.question, "red"), ans => {
        if (ans.toLowerCase().trim() == quiz.answer.toLowerCase().trim()) {
          score++;
          log("Su respuesta es:", "blue");
          log("correcta", "green");
          log(`Preguntas acertadas: ${colorize(score, "yellow")}`, "green");
          jugar();
        } else {
          log("Su respuesta es:", "blue");
          log("incorrecta", "red");
          log(`Fin. Has perdido. Preguntas acertadas: ${colorize(score, "yellow")}`, "green");
          rl.prompt();
        }
      });
    }
  }
  jugar();
}

exports.creditsCmd = rl => {
  log("Autores de la práctica: ");
  log("Manuel Rodríguez de la Coba");
  rl.prompt();
}

exports.quitCmd = rl => {
  rl.close();
  rl.prompt();
}