import Redis from "ioredis"


const redis = new Redis({
    host:process.env.HOSTNAME,
    port:process.env.PORT,
    password:process.env.PASSWORD
})

redis.on('connect', ()=>{
    console.log("redis connected.")
})

export default redis
