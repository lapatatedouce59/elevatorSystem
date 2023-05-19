let ws = new WebSocket('ws://localhost:8081')
let data=false
let uuid = false;
let username=false

import sm from './sm.js'
sm.init()

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

ws.addEventListener('open', ()=> {
    console.log('Connecté au WS')
    const weweOnAttends = async() => {
        await sleep(100)
        ws.send(JSON.stringify({
            op: 1,
            from: "ELEVATOR",
            uname: username||localStorage.getItem('dUsername')
        }));
        console.log(username)
    }
    weweOnAttends()

    ws.addEventListener('close', ()=>{
        alert('Le serveur viens de crash! Merci de signaler l\'erreur à La Patate Douce sur discord.gg/pmd en indiquant les actions effectuées!')
    })

    ws.addEventListener('error',()=>{
        alert('Le serveur viens de crash! Merci de signaler l\'erreur à La Patate Douce sur discord.gg/pmd en indiquant les actions effectuées!')
    })

    ws.addEventListener('message', msg =>{
        data = JSON.parse(msg.data);
        console.log(data);

        if(!(data.op)){
            ws.send(JSON.stringify({
                op: 2,
                demande: 'GET-UUID?'
            }))
        }else if(data.op===3){
            uuid=data.uuid
            console.log(uuid)
            ws.send(JSON.stringify({
                op: 4,
                demande: 'TEST-UUID?',
                uuid: uuid
            }))
        } else if (data.op===300){
            data=data.content
            console.log(data)
        }
    })
})