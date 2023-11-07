const express = require("express");
const path = require("path");
const hbs = require("hbs");
const fs = require("fs");
const app = express();
const con = require("./db/conn");
const Register = require("./models/register");
const exp = require("constants");
const nodemailer = require('nodemailer');
const { Console } = require("console");
const bcrypt = require('bcrypt');
const port = process.env.PORT || 3000;


const static_path = path.join(__dirname, "../public");
const template_path = path.join(__dirname, "../templates/views");
const partials_path = path.join(__dirname, "../templates/partials");
const bodyParser = require('body-parser');
app.use(express.static(static_path));
app.set("view engine", "hbs");
app.set("views", template_path);

const navbarPartialContent = fs.readFileSync(path.join(partials_path, "navbar.hbs"), "utf-8");
hbs.registerPartial("navbar", navbarPartialContent);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.get("/", (req, res) => {
    res.render("index1")
});

app.get("/response/:formId", (req, res) => {
    res.render("response")
})

app.get("/submit-response", (req, res) => {
    res.render("submit-response")
})
app.get("/bg4.jpg", (req, res) => {
    res.sendFile(static_path + "./bg4.jpg")
});

app.get("/forms", (req, res) => {
    res.render("forms");
});

app.get("/login", (req, res) => {
    res.send("register");
})

app.get("/forgotpassword", (req, res) => {
    res.render("email");
})

app.get("/signup", (req, res) => {
    res.render("index1");
})

app.get("/form/:formId", (req, res) => {
    const formId = req.params.formId;


    con.query("SELECT form_name FROM forms WHERE form_id = ?", [formId], (error, formNameResult) => {
        if (error) {
            console.error(error);
            return res.status(500).send("Error fetching form details.");
        }

        const formName = formNameResult[0].form_name;

        con.query("SELECT * FROM questions WHERE form_id = ?", [formId], (error, questions) => {
            if (error) {
                console.error(error);
                return res.status(500).send("Error fetching form details.");
            }

            const structuredQuestions = [];

            const fetchOptionsForQuestion = (questionId) => {
                return new Promise((resolve, reject) => {
                    con.query("SELECT * FROM options WHERE question_id = ?", [questionId], (error, options) => {
                        if (error) {
                            console.error(error);
                            reject("Error fetching options for question.");
                        } else {
                            console.log(`Options for question ${questionId}:`, options); // Log the fetched options
                            resolve(options);
                        }
                    });
                });
            };


            const fetchOptionsPromises = questions.map(async (question) => {
                const options = await fetchOptionsForQuestion(question.question_id);
                structuredQuestions.push({ question_text: question.question_text, options });
            });

            Promise.all(fetchOptionsPromises)
                .then(() => {
                    res.render("form_view", { formName, questions: structuredQuestions });
                })
                .catch((error) => {
                    console.error(error);
                    res.status(500).send("Error fetching options for questions.");
                });
        });
    });
});




let userId = "";

app.post("/login", async (req, res) => {
    const { fname, fpassword } = req.body;

    try {
        const user = await getUserByUsername(fname);

        if (user) {
            const passwordMatch = await bcrypt.compare(fpassword, user.password);

            if (passwordMatch) {
                userId = user.user_id;
                console.log(userId);
                return res.status(200).render("index");
            } else {
                return res.status(401).send("Invalid credentials");
            }
        } else {
            return res.redirect("/signup?userNotFound=true");
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send("Server error");
    }
});

function getUserByUsername(username) {
    return new Promise((resolve, reject) => {
        con.query("SELECT * FROM register WHERE username = ?", [username], (error, results) => {
            if (error) return reject(error);
            if (results.length > 0) {
                resolve(results[0]);
            } else {
                resolve(null);
            }
        });
    });
}

let username, useremail, userpassword;

app.get("/send-otp", (req, res) => {
    res.render("otp");
})

app.get("/send-otp1", (req, res) => {
    res.render("otpone");
})

app.get("/changepassword", (req, res) => {
    res.render("password");
})



const otp = Math.floor(100000 + Math.random() * 900000);

app.post("/send-otp", (req, res) => {
    username = req.body.fname;
    useremail = req.body.email;
    userpassword = req.body.fpassword;


    con.query("SELECT * FROM register;", (error, results) => {
        if (error) {
            throw error;
        }
        console.log(results);
        for (let i = 0; i < results.length; i++) {
            if (results[i].name == username) {
                res.status(400).send("username already exist");
            } else if (results[i].password == userpassword) {
                res.status(400).send("password already exist");
            }
        }
    });

    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        port: 587,
        auth: {
            user: 'pednekarprashant399@gmail.com',
            pass: ''
        }
    });

    const mailOptions = {
        from: 'pednekarprashant399@gmail.com',
        to: req.body.email,
        subject: 'Your OTP for Signup',
        text: `Your OTP for signup is: ${otp}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Error:', error);
            return res.status(500).send("Error sending OTP.");
        } else {
            console.log('Email sent:', info.response);
            console.log(otp);
            return res.status(200).render("otp");

        }
    });
});



app.post("/send-otp", (req, res) => {
    username = req.body.fname;
    useremail = req.body.email;
    userpassword = req.body.fpassword;


    con.query("SELECT * FROM register;", (error, results) => {
        if (error) {
            throw error;
        }
        console.log(results);
        for (let i = 0; i < results.length; i++) {
            if (results[i].username == username) {
                res.status(400).send("username already exist");
            } else if (results[i].password == userpassword) {
                res.status(400).send("password already exist");
            }
        }
    });

    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'pednekarprashant399@gmail.com',
            pass: ''
        }
    });

    const mailOptions = {
        from: 'pednekarprashant399@gmail.com',
        to: req.body.email,
        subject: 'Your OTP for Signup',
        text: `Your OTP for signup is: ${otp}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Error:', error);
            return res.status(500).send("Error sending OTP.");
        } else {
            console.log('Email sent:', info.response);
            console.log(otp);
            return res.status(200).render("otp");

        }
    });
});
useremail1 = "hi";
app.post("/forgotpassword", (req, res) => {
    useremail1 = req.body.email;
    console.log(useremail1)

    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'pednekarprashant399@gmail.com',
            pass: ''
        }
    });

    const mailOptions = {
        from: 'pednekarprashant399@gmail.com',
        to: req.body.email,
        subject: 'Your OTP for Signup',
        text: `Your OTP for signup is: ${otp}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Error:', error);
            return res.status(500).send("Error sending OTP.");
        } else {
            console.log('Email sent:', info.response);
            console.log(otp);
            return res.status(200).render("otpone");

        }
    });
});



app.post("/signup", async (req, res) => {
    const userEnteredOtp = req.body.otp;

    try {
        const existingUser = await getUserByEmail(useremail);
        if (existingUser) {
            return res.status(400).render("index");
        }

        if (userEnteredOtp == otp) {
            const hashedPassword = await bcrypt.hash(userpassword, 10); 

            con.query("INSERT INTO register (username, email, password) VALUES (?, ?, ?)",
                [username, useremail, hashedPassword],
                (error, results) => {
                    if (error) {
                        console.error(error);
                        return res.status(500).send("Error inserting user.");
                    }
                    console.log(results);
                    userId = results.insertId;
                    console.log(userId);
                    console.log("Data inserted successfully.");
                    return res.status(200).render("index");
                });
        } else {
            return res.status(400).send("Incorrect OTP. Please try again.");
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send("Server error.");
    }
});

function getUserByEmail(email) {
    return new Promise((resolve, reject) => {
        con.query("SELECT * FROM register WHERE email = ?", [email], (error, results) => {
            if (error) return reject(error);
            if (results.length > 0) {
                resolve(results[0]);
            } else {
                resolve(null);
            }
        });
    });
}




app.post("/changepassword", async (req, res) => {
    const userEnteredOtp = req.body.otp;
    const newpassword = req.body.newpassword;

    try {
        if (userEnteredOtp == otp) {
            const hashedPassword = await hashPassword(newpassword);

            con.query("UPDATE register SET password = ? WHERE email = ?;",
                [hashedPassword, useremail1],
                (error, results) => {
                    if (error) {
                        console.error(error);
                        return res.status(500).send("Error updating password.");
                    }
                    console.log("Password updated successfully.");
                    return res.status(200).render("index");
                });
        } else {
            return res.status(400).send("Incorrect OTP. Please try again.");
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send("Server error.");
    }
});

async function hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}


app.listen(port, () => {
    console.log(`server is running at port ${port}`);
});


app.post("/create-question", async (req, res) => {
    const formName = req.body.formName;
    const question = req.body.question;
    const options = req.body.options;
    const correctAnswerIndex = req.body.correctAnswerIndex;
    console.log(req.body)
    console.log(options)


    con.query("SELECT form_id FROM forms WHERE user_id = ? AND form_name = ?", [userId, formName], (error, results) => {
        if (error) {
            console.error('Error checking form existence:', error);
            return res.status(500).send('Error creating question.');
        }

        if (results.length > 0) {
            const formId = results[0].form_id;

            con.query("INSERT INTO questions (form_id, question_text) VALUES (?, ?)", [formId, question], (error, results) => {
                if (error) {
                    console.error('Error creating question:', error);
                    return res.status(500).send('Error creating question.');
                }

                const questionId = results.insertId; 

                const optionValues = options.map((option, index) => [
                    questionId, // question_id
                    option.optionText, // option_text
                    correctAnswerIndex // is_correct based on correctAnswerIndex
                ]);

                console.log("optionValues", optionValues)

                con.query("INSERT INTO options (question_id, option_text, is_correct) VALUES ?", [optionValues], (error, results) => {
                    if (error) {
                        console.error('Error creating options:', error);
                        return res.status(500).send('Error creating options for the question.');
                    }

                    return res.status(200).json({ formId, message: 'Question created successfully.' });
                });
            });
        } else {
            con.query("INSERT INTO forms (user_id, form_name) VALUES (?, ?)", [userId, formName], (error, results) => {
                if (error) {
                    console.error('Error creating form:', error);
                    return res.status(500).send('Error creating form.');
                }

                const formId = results.insertId; // Get the inserted form ID

                // Insert the question into the database with the correct form_id
                con.query("INSERT INTO questions (form_id, question_text) VALUES (?, ?)", [formId, question], (error, results) => {
                    if (error) {
                        console.error('Error creating question:', error);
                        return res.status(500).send('Error creating question.');
                    }

                    const questionId = results.insertId; // Get the inserted question ID
                    const optionValues = options.map((option, index) => [
                        questionId, // question_id
                        option.optionText, // option_text
                        correctAnswerIndex // is_correct based on correctAnswerIndex
                    ]);
                    console.log(optionValues);
                    con.query("INSERT INTO options (question_id, option_text, is_correct) VALUES ?", [optionValues], (error, results) => {
                        if (error) {
                            console.error('Error creating options:', error);
                            return res.status(500).send('Error creating options for the question.');
                        }

                        return res.status(200).json({ formId, message: 'Question created successfully.' });
                    });
                });
            });
        }
    });
});

// API endpoint to handle form submissions
app.post('/submit-response', (req, res) => {
    console.log('Received a POST request at /submit-response');

    const responses = req.body.responses; // Accessing responses from the 'responses' property

    if (!Array.isArray(responses) || responses.length === 0) {
        console.log('Invalid response data.', responses);
        res.status(400).send('Invalid response data.'); // Change status to 400 for bad request
        return;
    }

    const existingEmails = responses.map(response => response.email);
    const checkEmailsQuery = 'SELECT email FROM responses WHERE email IN (?)';
    con.query(checkEmailsQuery, [existingEmails], (checkError, checkResults) => {
        if (checkError) {
            console.error('Error checking email existence:', checkError);
            res.status(500).send('Error checking email existence.');
            return;
        }

        // Filter out responses with existing email IDs
        const newResponses = responses.filter(response => {
            const emailExists = checkResults.some(result => result.email === response.email);
            return !emailExists;
        });

        // If all responses have existing email IDs, respond with an error
        if (newResponses.length === 0) {
            res.status(400).send('Responses with these email IDs already exist.');
            return;
        }

        const values = newResponses.map(response => [
            response.question_id,
            response.option_id,
            response.correct,
            response.user_id,
            response.name,
            response.email,
            response.responseTime
        ]);

        const sql = 'INSERT INTO responses (question_id, option_id,correct, user_id, name, email, response_time) VALUES ?';

        con.query(sql, [values], (error, results) => {
            if (error) {
                console.error('Error inserting responses:', error);
                res.status(500).send('Error inserting responses.');
            } else {
                console.log('Responses inserted successfully.');
                const jsonResponse = { message: 'Responses inserted successfully.' };
                res.status(200).json(jsonResponse); // Send a JSON response
            }
        });
    });
});







app.get('/users', (req, res) => {
    const query = `
    SELECT
    forms.form_id,
    forms.form_name,
    questions.question_id,
    questions.question_text,
    options.option_id,
    options.option_text
FROM
    forms
JOIN
    questions ON forms.form_id = questions.form_id
JOIN
    options ON questions.question_id = options.question_id
WHERE
    forms.user_id = ?

    `;

    con.query(query, [userId], (error, results) => {
        if (error) {
            console.error('Error fetching forms data: ' + error.stack);
            return res.status(500).json({ error: 'Error fetching data' });
        }
        res.json(results);
    });
});

app.get("/user", (req, res) => {
    res.render("all_forms");
})

app.get('/get-responses/:formId', async (req, res) => {
    const formId = req.params.formId;
    console.log(formId); // Get the form_id from the URL parameter

    const query = `
    SELECT r.*, COUNT(R2.user_id) AS num_questions_answered
    FROM responses R
    JOIN questions Q ON R.question_id = Q.question_id
    JOIN options O ON R.option_id = O.option_id
    LEFT JOIN responses R2 ON R.user_id = R2.user_id
    WHERE O.is_correct = R.correct
      AND Q.form_id = ?
    GROUP BY R.user_id, r.response_time
    ORDER BY num_questions_answered DESC, response_time;
    
    `;

    const query1 = `
    SELECT R.name, R.email, COUNT(R.id) AS num_correct_responses
    FROM responses R
    JOIN questions Q ON R.question_id = Q.question_id
    JOIN options O ON R.option_id = O.option_id
    WHERE O.is_correct = R.correct
      AND Q.form_id = ?
    GROUP BY R.email
    `;

    // Use Promise.all to wait for both queries to complete
    Promise.all([
        new Promise((resolve, reject) => {
            con.query(query, [formId], (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        }),
        new Promise((resolve, reject) => {
            con.query(query1, [formId], (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        }),
    ])
        .then(([responseData, responseData1]) => {
            res.json({ data: responseData, data1: responseData1 });
        })
        .catch(error => {
            throw error;
        });
});

app.post('/ask-question', (req, res) => {
    const { questionText, formId1 } = req.body;
    console.log("Question text : ", questionText, " , ", formId1)
    if (!questionText) {
        return res.status(400).json({ message: 'Question is required' });
    }



    // Send the question to the administrator's email
    // const mailOptions = {
    //   from: 'your_admin_email@gmail.com',
    //   to: 'admin@example.com', // Replace with the administrator's email address
    //   subject: 'New Question from User',
    //   text: `New question: ${questionText}`,
    // };

    // transporter.sendMail(mailOptions, (error, info) => {
    //   if (error) {
    //     console.error('Error sending email:', error);
    //     return res.status(500).json({ message: 'Failed to send the question' });
    //   }

    //   console.log('Email sent:', info.response);
    //   return res.status(200).json({ message: 'Question sent successfully' });
    // });


    //fetching data from the database
    let query = `select user_id from forms where form_id=?`;
    let user = 0;
    con.query(query, formId1, (error, result) => {
        if (error) {
            console.error('Error fetching forms data: ' + error.stack);
            return res.status(500).json({ error: 'Error fetching data' });
        }
        user = result[0].user_id;
        console.log("userId : ", user)
        query = `select email from register where user_id=?`;
        let email = 0;
        con.query(query, user, (error, result) => {
            if (error) {
                console.error('Error fetching forms data: ' + error.stack);
                return res.status(500).json({ error: 'Error fetching data' });
            }
            email = result[0].email;
            console.log("email : ", email)

            //sending email to the administrator
            const transporter = nodemailer.createTransport({
                service: 'Gmail',
                port: 587,
                auth: {
                    user: 'pednekarprashant399@gmail.com',
                    pass: ''
                }
            });

            const mailOptions = {
                from: 'pednekarprashant399@gmail.com',
                to: email,
                subject: 'query from user',
                text: questionText
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log('Error:', error);
                    return res.status(500).send("Error sending messesge");
                } else {
                    console.log('Email sent:', info.response);
                }
            });
        })
    })


    res.status(200).json({ message: 'Question received successfully' });
});


app.post("/update-question", async (req, res) => {
    const formName = req.body.formName;
    const question = req.body.question;
    const options = req.body.options;
    const correctAnswerIndex = req.body.correctAnswerIndex;
    const formId = req.body.formId;
    const questionId = req.body.questionId;
    console.log(req.body)
    // Update the question in the database
    con.query(
        "UPDATE questions SET question_text = ? WHERE form_id = ? AND question_id = ?",
        [question, formId, questionId],
        (error, results) => {
            if (error) {
                console.error('Error updating question:', error);
                return res.status(500).send('Error updating question.');
            }

            // Delete existing options for the question
            con.query(
                "DELETE FROM options WHERE question_id = ?",
                [questionId],
                (error, results) => {
                    if (error) {
                        console.error('Error deleting options:', error);
                        return res.status(500).send('Error updating question options.');
                    }

                    // Insert the updated options into the database
                    const optionValues = options.map((option, index) => [
                        questionId, // question_id
                        option, // option_text
                        correctAnswerIndex, // is_correct based on correctAnswerIndex
                    ]);

                    con.query(
                        "INSERT INTO options (question_id, option_text, is_correct) VALUES ?",
                        [optionValues],
                        (error, results) => {
                            if (error) {
                                console.error('Error creating options:', error);
                                return res.status(500).send('Error creating options for the question.');
                            }

                            return res.status(200).json({ formId, message: 'Question updated successfully.' });
                        }
                    );
                }
            );
        }
    );
});


app.post('/remove-question', (req, res) => {
    const formId = req.body.formId;
    const questionId = req.body.questionId;
  
    // Remove options associated with the question
    con.query(
      'DELETE FROM options WHERE question_id = ?',
      [questionId],
      (error, results) => {
        if (error) {
          console.error('Error deleting options:', error);
          return res.status(500).send('Error removing question options.');
        }
  
        // Remove the question
        con.query(
          'DELETE FROM questions WHERE form_id = ? AND question_id = ?',
          [formId, questionId],
          (error, results) => {
            if (error) {
              console.error('Error removing question:', error);
              return res.status(500).send('Error removing question.');
            }
  
            return res.status(200).json({ message: 'Question and options removed successfully.' });
          }
        );
      }
    );
  });