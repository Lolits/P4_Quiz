const { models } = require("./model");
const Sequelize = require("sequelize");
const { colorize, log, biglog, errorlog } = require("./out");

const validateId = id => {
  return new Sequelize.Promise((resolve, reject) => {
    if (typeof id === "undefined") {
      reject(new Error(`Falta el parámetro <id>.`));
    } else {
      id = parseInt(id);
      if (Number.isNaN(id)) {
        reject(new Error(`El valor del parámetro <id> no es un número`));
      } else {
        resolve(id);
      }
    }
  });
}

const makeQuestion = (rl, text) => {
  return new Sequelize.Promise((resolve, reject) => {
    rl.question(colorize(text, "red"), answer => {
      resolve(answer.trim());
    });
  });
}

exports.helpCmd = (socket, rl) => {
  log(socket, "Commandos: ");
  log(socket, "h|help - Muestra esta ayuda.");
  log(socket, "list - Listar los quizzes existentes.");
  log(socket, "show <id> - Muestra la pregunta y la respuesta el quiz indicado.");
  log(socket, "add - Añadir un nuevo quiz interactivamente.");
  log(socket, "delete <id> - Borrar el quiz indicado.");
  log(socket, "edit <id> - Editar el quiz indicado.");
  log(socket, "test <id> - Probar el quiz indicado.");
  log(socket, "p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
  log(socket, "credits - Créditos.");
  log(socket, "q|quit - Salir del programa.");
  rl.prompt();
}

exports.listCmd = (socket, rl) => {
  models.quiz.findAll()
    .each(quiz => {
      log(socket, `[${colorize(quiz.id, "magenta")}]: ${quiz.question}`);
    })
    .catch(error => {
      errorlog(socket, error.message);
    })
    .then(() => {
      rl.prompt();
    });
}

exports.showCmd = (socket, rl, id) => {
  validateId(id)
    .then(id => models.quiz.findById(id))
    .then(quiz => {
      if (!quiz) {
        throw new Error(`No exite un quiz asociado al id = ${id}`);
      }
      log(socket, `[${colorize(id, "magenta")}]: ${quiz.question} ${colorize("=>", "magenta")} ${quiz.answer}`);
    })
    .catch(error => {
      errorlog(socket, error.message);
    })
    .then(() => {
      rl.prompt();
    })
}


exports.addCmd = (socket, rl, id) => {
  makeQuestion(rl, "Introduzca una pregunta: ")
    .then(q => {
      return makeQuestion(rl, "Introduzca la respuesta: ")
        .then(a => {
          return { question: q, answer: a };
        });
    })
    .then(quiz => {
      return models.quiz.create(quiz);
    })
    .then(quiz => {
      log(socket, `${colorize("Se ha añadido", "magenta")}: ${quiz.question} ${colorize("=>", "magenta")} ${quiz.answer}`);
    })
    .catch(Sequelize.ValidationError, error => {
      errorlog(socket, "El quiz es erróneo: ");
      error.errors.forEach(({ message }) => errorlog(message));
    })
    .catch(error => {
      errorlog(socket, error.message);
    })
    .then(() => {
      rl.prompt();
    });
}

exports.deleteCmd = (socket, rl, id) => {
  validateId(id)
    .then(id => models.quiz.destroy({ where: { id } }))
    .catch(error => {
      errorlog(socket, error.message);
    })
    .then(() => {
      rl.prompt();
    });
}

exports.editCmd = (socket, rl, id) => {
  validateId(id)
    .then(id => models.quiz.findById(id))
    .then(quiz => {
      if (!quiz) {
        throw new Error(`No existe un quiz asociado al id = ${id}`);
      }
      process.stdout.isTTY && setTimeout(() => { rl.write(quiz.question) }, 0);
      return makeQuestion(rl, "Introduzca una pregunta: ")
        .then(q => {
          process.stdout.isTTY && setTimeout(() => { rl.write(quiz.question) }, 0);
          return makeQuestion(rl, "Introduzca la respuesta: ")
            .then(a => {
              quiz.question = q;
              quiz.answer = a;
              return quiz;
            });
        });
    })
    .then(quiz => {
      return quiz.save();
    })
    .then(quiz => {
      log(socket, `Se ha cambiado el quiz ${colorize(quiz.id, "magenta")} por: ${quiz.question} ${colorize("=>", "magenta")} ${quiz.answer}`);
    })
    .catch(Sequelize.ValidationError, error => {
      errorlog(socket, "El quiz es erróneo: ");
      error.errors.forEach(({ message }) => errorlog(message));
    })
    .catch(error => {
      errorlog(socket, error.message);
    })
    .then(() => {
      rl.prompt();
    });
}

exports.testCmd = (socket, rl, id) => {
  validateId(id)
    .then(id => models.quiz.findById(id))
    .then(quiz => {
      if (!quiz) {
        throw new Error(`No existe un quiz asociado al id = ${id}`);
      }
      return makeQuestion(rl, quiz.question)
        .then(a => {
          if (a.toLowerCase().trim() == quiz.answer.toLowerCase().trim()) {
            log(socket, "Su respuesta es:", "blue");
            log(socket, "correcta", "green");
          } else {
            log(socket, "Su respuesta es:", "blue");
            log(socket, "incorrecta", "red");
          }
        });
    })
    .catch(Sequelize.ValidationError, error => {
      errorlog(socket, "El quiz es erróneo: ");
      error.errors.forEach(({ message }) => errorlog(message));
    })
    .catch(error => {
      errorlog(socket, error.message);
    })
    .then(() => {
      rl.prompt();
    });
}

exports.playCmd = (socket, rl) => {
  let score = 0;
  let toBeResolved = new Array();
  models.quiz.findAll()
    .then(quizzes => {
      quizzes.forEach((quiz, id) => {
        toBeResolved[id] = quiz;
      });
      const jugar = () => {
        if (toBeResolved.length === 0) {
          log(socket, "¡Enhorabuena!", "green");
          log(socket, `Fin. Has ganado. Preguntas acertadas: ${colorize(score, "yellow")}`, "green");
          rl.prompt();
        } else {
          var azar = Math.floor(Math.random() * toBeResolved.length);
          let quiz = toBeResolved[azar];
          toBeResolved.splice(azar, 1);
          return makeQuestion(rl, quiz.question)
            .then(a => {
              if (a.toLowerCase().trim() == quiz.answer.toLowerCase().trim()) {
                score++;
                log(socket, "Su respuesta es:", "blue");
                log(socket, "correcta", "green");
                log(socket, `Preguntas acertadas: ${colorize(score, "yellow")}`, "green");
                jugar();
              } else {
                log(socket, "Su respuesta es:", "blue");
                log(socket, "incorrecta", "red");
                log(socket, `Fin. Has perdido. Preguntas acertadas: ${colorize(score, "yellow")}`, "green");
                rl.prompt();
              }
            })
            .catch(Sequelize.ValidationError, error => {
              errorlog(socket, "El quiz es erróneo: ");
              error.errors.forEach(({ message }) => errorlog(message));
            })
            .catch(error => {
              errorlog(socket, error.message);
            })
            .then(() => {
              rl.prompt();
            });
        }
      }
      jugar();
    });
}

exports.creditsCmd = (socket, rl) => {
  log(socket, "Autores de la práctica: ");
  log(socket, "Manuel Rodríguez de la Coba");
  rl.prompt();
}

exports.quitCmd = (socket, rl) => {
  rl.close();
  socket.end();
}