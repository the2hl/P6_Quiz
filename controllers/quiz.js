const Sequelize = require("sequelize");
const {models} = require("../models");

// Autoload the quiz with id equals to :quizId
exports.load = (req, res, next, quizId) => {

    models.quiz.findById(quizId)
    .then(quiz => {
        if (quiz) {
            req.quiz = quiz;
            next();
        } else {
            throw new Error('There is no quiz with id=' + quizId);
        }
    })
    .catch(error => next(error));
};


// GET /quizzes
exports.index = (req, res, next) => {

    models.quiz.findAll()
    .then(quizzes => {
        res.render('quizzes/index.ejs', {quizzes});
    })
    .catch(error => next(error));
};


// GET /quizzes/:quizId
exports.show = (req, res, next) => {

    const {quiz} = req;

    res.render('quizzes/show', {quiz});
};


// GET /quizzes/new
exports.new = (req, res, next) => {

    const quiz = {
        question: "", 
        answer: ""
    };

    res.render('quizzes/new', {quiz});
};

// POST /quizzes/create
exports.create = (req, res, next) => {

    const {question, answer} = req.body;

    const quiz = models.quiz.build({
        question,
        answer
    });

    // Saves only the fields question and answer into the DDBB
    quiz.save({fields: ["question", "answer"]})
    .then(quiz => {
        req.flash('success', 'Quiz created successfully.');
        res.redirect('/quizzes/' + quiz.id);
    })
    .catch(Sequelize.ValidationError, error => {
        req.flash('error', 'There are errors in the form:');
        error.errors.forEach(({message}) => req.flash('error', message));
        res.render('quizzes/new', {quiz});
    })
    .catch(error => {
        req.flash('error', 'Error creating a new Quiz: ' + error.message);
        next(error);
    });
};


// GET /quizzes/:quizId/edit
exports.edit = (req, res, next) => {

    const {quiz} = req;

    res.render('quizzes/edit', {quiz});
};


// PUT /quizzes/:quizId
exports.update = (req, res, next) => {

    const {quiz, body} = req;

    quiz.question = body.question;
    quiz.answer = body.answer;

    quiz.save({fields: ["question", "answer"]})
    .then(quiz => {
        req.flash('success', 'Quiz edited successfully.');
        res.redirect('/quizzes/' + quiz.id);
    })
    .catch(Sequelize.ValidationError, error => {
        req.flash('error', 'There are errors in the form:');
        error.errors.forEach(({message}) => req.flash('error', message));
        res.render('quizzes/edit', {quiz});
    })
    .catch(error => {
        req.flash('error', 'Error editing the Quiz: ' + error.message);
        next(error);
    });
};


// DELETE /quizzes/:quizId
exports.destroy = (req, res, next) => {

    req.quiz.destroy()
    .then(() => {
        req.flash('success', 'Quiz deleted successfully.');
        res.redirect('/quizzes');
    })
    .catch(error => {
        req.flash('error', 'Error deleting the Quiz: ' + error.message);
        next(error);
    });
};


// GET /quizzes/:quizId/play
exports.play = (req, res, next) => {

    const {quiz, query} = req;

    const answer = query.answer || '';

    res.render('quizzes/play', {
        quiz,
        answer
    });
};


// GET /quizzes/:quizId/check
exports.check = (req, res, next) => {

    const {quiz, query} = req;

    const answer = query.answer || "";
    const result = answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim();

    res.render('quizzes/result', {
        quiz,
        result,
        answer
    });
};

// GET /quizzes/randomplay
exports.randomplay = (req, res, next) => {

    console.log("***** RANDOMPLAY *****");

    let score = req.session.score || 0;
    let arrayQuizzes = [];
    // array con los ids de las preguntas por contestar
    if (req.session.randomPlay == null){
        console.log("no existe req.session.randomPlay");
        models.quiz.findAll()
        .each(quiz =>{
            if (quiz) {
                arrayQuizzes.push(quiz.id);
                console.log("quiz: "+quiz.id+"\n");
                console.log("ids de preguntas por contestar:"+arrayQuizzes.toString()+"\n");
            } else {
                throw new Error('There is no quiz with id=' + quizId);
            }
        })
        .then(()=>{
            let pos_random = Math.floor(Math.random()*arrayQuizzes.length);
            console.log("posicion del array de ids: "+pos_random+"\n");

            let indice = arrayQuizzes.splice(pos_random, 1);
            console.log("id de quizz para playrandom:"+indice+"\n");

            models.quiz.findById(parseInt(indice))
            .then(quiz => {
                if (quiz) {
                    req.session.randomPlay = arrayQuizzes;
                    console.log("***** RANDOMPLAY *****");
                    res.render('quizzes/random_play', {
                        quiz,
                        score,
                    });
                } else {
                    throw new Error('There is no quiz with id=' + quizId);
                }
            });
        });
    }
    else{
        console.log("ya existe req.session.randomPlay");
        if(req.session.randomPlay.length == 0){
            console.log("ya se contestaron todas las preguntas");
            req.session.randomPlay = null;
            req.session.score = null;
            console.log("***** RANDOMPLAY *****");
            res.render('quizzes/random_nomore', {
                score,
            });
        }
        else{
            arrayQuizzes = req.session.randomPlay;
            console.log("ids de preguntas por contestar:"+arrayQuizzes.toString()+"\n");

            if(arrayQuizzes.length > 0){
                let pos_random = Math.floor(Math.random()*arrayQuizzes.length);
                console.log("posicion del array de ids: "+pos_random+"\n");

                let indice = arrayQuizzes.splice(pos_random, 1);
                console.log("id de quizz para playrandom: "+indice+"\n");

                models.quiz.findById(parseInt(indice))
                .then(quiz => {
                    if (quiz) {
                        req.session.randomPlay = arrayQuizzes;
                        arrayQuizzes = null;
                        console.log("***** RANDOMPLAY *****");
                        res.render('quizzes/random_play', {
                            quiz,
                            score,
                        });
                    } else {
                        throw new Error('There is no quiz with id=' + quizId);
                    }
                });

            }
        }
    }
};

// GET /quizzes/randomcheck/:quizId
exports.randomcheck = (req, res, next) => {

    console.log("***** RANDOMCHECK *****");

    const {quiz, query} = req;

    let score = req.session.score || 0;

    const answer = query.answer || "";
    const result = answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim();

    if (result){
        console.log("respuesta correcta");
        score++;
        req.session.score = score;
    }
    else{
        console.log("respuesta incorrecta");
        req.session.score = null;
        req.session.randomPlay = null;
    }

    console.log("***** RANDOMCHECK *****");
    
    res.render('quizzes/random_result', {
        quiz,
        score,
        result,
        answer
    });
};