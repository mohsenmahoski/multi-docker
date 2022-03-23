require('dotenv').config();
const keys = require('./keys');

const { redisHost, redisPort } = keys;
// Redis Client Setup
const redis = require('redis');
const redisClient = redis.createClient({
    url: `redis://:@${redisHost}:${redisPort}`
});

(async()=>{

        console.log("####################");
    
        console.log(redisHost);
        console.log(redisPort);
    
        console.log("####################");
    

        redisClient.on('error', (err) => console.log('Redis Client Error', err));
        await redisClient.connect();
        
        const subscriber = redisClient.duplicate();
         await subscriber.connect();
    
        function fib (index) {
           if(index < 2) return 1;
           return fib(index - 1) + fib(index - 2);
        }
        
        await subscriber.subscribe('insert', (message) => {
            console.log("####################");
            console.log(message); // 'message'
            redisClient.hSet('values', message, fib(parseInt(message)));
            console.log("####################");
        });
})()
        

