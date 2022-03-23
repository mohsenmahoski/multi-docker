require('dotenv').config();

const keys = require("./keys");


// Postgres Client Setup
const { Pool } = require('pg');
const {redisHost,redisPort, pgUser, pgHost, pgDatabase,pgPassword,pgPort} = keys;

const pgOptions = {
    user: pgUser,
    host: pgHost,
    database: pgDatabase,
    password: pgPassword,
    port: pgPort
};
const pgClient = new Pool(pgOptions);


// Redis Client Setup
const redis = require('redis');
const redisClient = redis.createClient({
    url: `redis://:@${redisHost}:${redisPort}`
});



// Express App Setupt

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());



pgClient.connect((err, client, release) => {
    if(!err){
        console.log(">>>>>>>>>>>>>>>>>>>>>>>> TRY TO CREATE TABLE");
        client.query('CREATE TABLE IF NOT EXISTS values (number INT)')
            .then(async () => {
                
                redisClient.on('error', (err) => console.log('Redis Client Error', err));
                await redisClient.connect();
                const redisPublisher = redisClient.duplicate();
                await redisPublisher.connect();

                server = app.listen(5000, async(err) => {
                    try {
                        server.timeout = 30;
                        console.log(`Server Running on port ${5000}`);

                        app.get("/" , (req, res , next) => {
                            return res.status(200).json({
                                message: "Hi"
                            });
                        });

                        app.get("/values/all" , async (req, res , next) => {
                            try {

                                client.query('SELECT * FROM values', (err, result) => {
                                    console.log(">>>>>>>>>>>>>>>>>>> values/all");
                                    return res.status(200).json({
                                        result: result.rows
                                    });
                                });

                            } catch (error) {

                                console.log(">>>>>>>>>>>>>>>>>>> error");
                                
                                console.log(error);

                                console.log(">>>>>>>>>>>>>>>>>>");

                            }
                        });

                        app.get("/values/current" , async (req, res , next) => {
                            console.log(">>>>>>>>>>>>>>>>>>> values/current");

                            const result = await redisClient.hGetAll('values');

                            console.log(result);
                            console.log(">>>>>>>>>>>>>>>>>>>>>>>>");

                            return res.status(200).json({
                                result
                            });
                        });

                        app.post('/values', async(req, res) => {
                        try {
                            const { index } = req.body;
                            if(parseInt(index) > 40){
                                return res.status(400).json({
                                    message: 'Index too high'
                                });
                            }

                            console.log(">>>>>>>>>>>>>>>>>>> values: POST");
                            
                            console.log(index);

                            console.log(">>>>>>>>>>>>>>>>>>");

                            redisClient.hSet('values', index, 'Nothing yet!');
                            redisPublisher.publish('insert', index);
                            
                            await client.query('INSERT INTO values(number) VALUES($1)', [index]);

                            res.status(200).json({
                                message: "Saved."
                            });
                        } catch (error) {
                            console.log(">>>>>>>>>>>>>>>>>>> values: POST error");
                            
                            console.log(error);

                            console.log(">>>>>>>>>>>>>>>>>>");
                            res.status(500).json({
                                message: "error in server"
                            });
                        }
                        });

                    } catch (error) {
                        console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>ERROR");
                        console.log(error);
                        console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>");
                
                        proccess.exit(1);
                    }
                });
            })
            .catch((error) => {
                console.log(error);
                proccess.exit(1);
            }); 
    }
});
        

