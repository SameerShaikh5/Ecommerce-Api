import Redis from "ioredis"


const redis = new Redis({
    host:"redis-10664.c61.us-east-1-3.ec2.redns.redis-cloud.com",
    port:10664,
    password:"bmZGpZBoAuYaplZlO5Sr8w1M5KxZiNX3"
})

redis.on('connect', ()=>{
    console.log("redis connected.")
})

export default redis