const logger = require('./logger')
const fs = require('fs')
const https = require('https')

const {WebSocket, WebSocketServer} = require('ws');
const wss = new WebSocket.Server({ port: 8081 });
/*const server = https.createServer({
    cert: fs.readFileSync('/etc/letsencrypt/live/patate.ddns.net/fullchain.pem'),
    key: fs.readFileSync('/etc/letsencrypt/live/patate.ddns.net/privkey.pem')
})


const wss = new WebSocketServer({server});

server.listen(8081, function listening() {
    console.log('Address: ', wss.address());
});*/
const {setTimeout} = require('timers/promises')
const elevApi=require('./server.json');
const {v4} = require('uuid')
const clients = new Map();

function apiSave(){
    fs.writeFileSync('./server.json', JSON.stringify(elevApi, null, 2));

    wss.broadcast(JSON.stringify({
        op: 300,
        content: elevApi
    }))
    logger.message('broadcast','NEW SERVER DATA => REFRESH')
    //ws.send();
}

function isClientExisting(uuid){
    console.log(uuid)
    if(clients.get(uuid)) return true;
    /*for(let client of clients){
        console.log(client[0])
        if(uuid===client.uuid){
            return true;
        } else {
            continue;
        }
    }*/
    return false;
}

wss.broadcast = function broadcast(msg) {
    wss.clients.forEach(function each(client) {
        client.send(msg);
    });
};

wss.on('connection', (ws, req) => {
    let newUUID;
    logger.client(true)
    let clientIp=req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    newUUID = v4();

    ws.on('message', msg => {
        let data
        try{
            data = JSON.parse(msg);
        } catch (error) {
            logger.error(error)
        }
        op = data.op;

        if(op==='300') return;
        
        switch(op){
            case 1 :
                console.log(clientIp)
                let client = {uuid: newUUID, ip: clientIp, instance:data.from, uname: data.uname};
                clients.set(newUUID,client)
                console.log(clients)
                logger.identify(clientIp, newUUID, clients.get(newUUID).instance)
                logger.message('outcome','server.json')
                //ws.send(JSON.stringify(pccApi));
                ws.send(JSON.stringify(elevApi));
                break;
            case 2:
                console.log('Demande d\'UUID reçue. Envoi dans 1 seconde.')
                const bahOnVaAttendreSinonLautreIlVaPasEtreContent = async() => {
                    await setTimeout(1000)
                    logger.message('outcome',newUUID)
                    ws.send(JSON.stringify({uuid: newUUID, op:3}))
                }
                bahOnVaAttendreSinonLautreIlVaPasEtreContent()
                console.log('UUID envoyée.')
                break;
            case 4:
                console.log('['+clients.get(data.uuid).uuid+'] Confirmation d\'UUID reçue. Envoi dans 1 seconde.')
                const goEncoreAttendre = async() => {
                    await setTimeout(400)
                    if(!isClientExisting(data.uuid)) return;
                    wss.broadcast(JSON.stringify({
                        op: 10,
                        content: { uuid: clients.get(data.uuid).uuid, uname: clients.get(data.uuid).uname }
                    }))
                    await setTimeout(400)
                    logger.message('broadcast','ARRIVAL')
                    wss.broadcast(JSON.stringify({
                        op: 300,
                        content: elevApi
                    }))
                    logger.message('outcome','server.json')
                }
                goEncoreAttendre()
                console.log('Serveur envoyée.')
                break;
            case 200 :
                if(!isClientExisting(data.uuid)) return;
                logger.message('income',JSON.stringify(data),clients.get(data.uuid).uname,clients.get(data.uuid).ip,clients.get(data.uuid).instance)
                
        }
    })

    ws.on('close', ()=>{
        wss.broadcast(JSON.stringify({
            op: 11
        }))
        logger.message('broadcast','DEPARTURE')
        logger.client(false)
    })
})