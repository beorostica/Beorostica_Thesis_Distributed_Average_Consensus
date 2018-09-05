//UDP variables and objects:
var udp_datagram    = require('dgram');
var udp_port        = 4000;
var udp_numberIP    = '10.42.43.101';
var udp_broadcastIP = '10.42.43.255';
var udp_client      = udp_datagram.createSocket('udp4');
var udp_server      = udp_datagram.createSocket('udp4');

//Agent's state:
var state   = 25;
var state_1 = 25;
var state_2 = 1;


//Since here, all agents must have the same code!!!
//Simulation number:
var simulation_number = '20';

//Constants for protocol:
var protocol_type = 2;      //1: BroadcastGossip,   2: PushSum
var gamma = 5/6;            //For BroadcastGossip
var alpha = 1/6;            //For PushSum

//Timer frecuency, stop condition and last state definition:
var timer_interval = 2000;
var stop_value     = 0.001;
var state_last     = state + 2*stop_value;      //Just a invalid stop condition

//Operation mode:
var MODE_ON = 0;            //0: OFF,   1:ON

//Elements for debbuging:
var file = require('fs');
var file_name = '/var/lib/cloud9/Beorostica/DATA_protocol_' + protocol_type + '_simulation_' + simulation_number + '_agent_' + udp_numberIP.substring(9) + '.txt';
var date = new Date();

//Initial Print on file:
file.writeFile(file_name,'LOG DATA.\n\n');
for(var i = 0; i < 1000000; i++){};
file.appendFile(file_name,'Legend:\n');
file.appendFile(file_name,'state;state_1;state_2.\n');


//****************************************************************************//
//*** Send UDP datagram to Broadcast *****************************************//
//****************************************************************************//

//Let broadcast transmission:
udp_client.bind( 
    function(){ 
        udp_client.setBroadcast(true) 
    } 
);

//Set timer interval for Tx data:
setInterval(send_UDPdatagram, timer_interval);

//Each step, send UDP datagram:
function send_UDPdatagram(){
    
    if(MODE_ON == 1){
    
        //Change state according protocol_I:
        state_1    = protocol_I(state_1);
        state_2    = protocol_I(state_2); 
        state      = protocol_RESULT(state_1, state_2);
        
        //Send actual state:
        var udp_message_Tx = new Buffer("" + state_1 + ";" + state_2);
        udp_client.send(
            udp_message_Tx, 0, udp_message_Tx.length, udp_port, udp_broadcastIP, 
            function(err,bytes){
                if(err){
                    throw err;    
                }
            }
        );
        
        //Console print for debugging:
        console.log('x_i-update: {x;x1;x2} = '+ state + ";" + state_1 + ";" + state_2);
        file.appendFile(file_name, state + ";" + state_1 + ";" + state_2 + '\n');
        //console.log('UDP message sent: ' + udp_message_Tx);
    
    }
    
}


//****************************************************************************//
//*** Receive UDP datagram from Someone **************************************//
//****************************************************************************//

//Bind server port:
udp_server.bind(udp_port);

//Receive UDP message:
udp_server.on(
    'message',
    function(udp_message_Rx, udp_Rx_info){
        
        //Change operation mode to OFF:
        if((udp_message_Rx == 'stop') && (MODE_ON==1)){
            MODE_ON = 0;
            date = new Date();
            console.log(" ");
            console.log("External Stop");
            console.log('Protocol type: ' + protocol_type);
            if(protocol_type == 1){ console.log("gamma: " + gamma);}
            if(protocol_type == 2){ console.log("alpha: " + alpha);}
            console.log("Agent's IP address: " + udp_numberIP);
            console.log("Date: " + date.getTime() );
            file.appendFile(file_name,'\n');
            file.appendFile(file_name,'External Stop.\n');
            file.appendFile(file_name,'Protocol type: ' + protocol_type + '\n');
            if(protocol_type == 1){ file.appendFile(file_name,"gamma: " + gamma + '\n');}
            if(protocol_type == 2){ file.appendFile(file_name,"alpha: " + alpha + '\n');}
            file.appendFile(file_name,"Agent's IP address: " + udp_numberIP + '\n');
            file.appendFile(file_name,'Date: ' + date.getTime() + '\n');
        }
        
        //Receive only if this agent didn't send the datagram and operation mode is ON:
        if((udp_Rx_info.address != udp_numberIP) && (MODE_ON == 1) && (udp_message_Rx != 'start') && (udp_message_Rx != 'stop')){
            
            //Get states from datagram:
            var string_received = udp_message_Rx.toString();
            var index_reference = string_received.indexOf(";");
            var state_Rx_1 = 1*string_received.substring(0,index_reference);
            var state_Rx_2 = 1*string_received.substring(index_reference+1);
            
            //Change state according protocol_J:
            state_1    = protocol_J(state_Rx_1, state_1);
            state_2    = protocol_J(state_Rx_2, state_2);
            state_last = state;
            state      = protocol_RESULT(state_1, state_2);
            MODE_ON    = protocol_STOP(state, state_last);
            
            //Console print for debugging:
            console.log('x_j-update: {x;x1;x2} = '+ state + ";" + state_1 + ";" + state_2);
            file.appendFile(file_name, state + ";" + state_1 + ";" + state_2 + '\n');
            //console.log('UDP message received: ' + udp_message_Rx);
            
            if(MODE_ON == 0){
                
                //Last Send://///////////////////////////////////////////////////////////
                //Change state according protocol_I:
                state_1    = protocol_I(state_1);
                state_2    = protocol_I(state_2); 
                
                //Send state:
                var udp_message_Tx = new Buffer("" + state_1 + ";" + state_2);
                udp_client.send(
                    udp_message_Tx, 0, udp_message_Tx.length, udp_port, udp_broadcastIP, 
                    function(err,bytes){
                        if(err){
                            throw err;    
                        }
                    }
                );
                ////////////////////////////////////////////////////////////////////////
                
                date = new Date();
                console.log(" ");
                console.log('Stop by other agent.');
                console.log('Protocol type: ' + protocol_type);
                if(protocol_type == 1){ console.log("gamma: " + gamma);}
                if(protocol_type == 2){ console.log("alpha: " + alpha);}
                console.log("Agent's IP address: " + udp_numberIP);
                console.log("Date: " + date.getTime() );
                file.appendFile(file_name,'\n');
                file.appendFile(file_name,'Stop by other agent.\n');
                file.appendFile(file_name,'Protocol type: ' + protocol_type + '\n');
                if(protocol_type == 1){ file.appendFile(file_name,"gamma: " + gamma + '\n');}
                if(protocol_type == 2){ file.appendFile(file_name,"alpha: " + alpha + '\n');}
                file.appendFile(file_name,"Agent's IP address: " + udp_numberIP + '\n');
                file.appendFile(file_name,'Date: ' + date.getTime() + '\n');
            }
            
        }
        
        //Change operation mode to ON:
        if((udp_message_Rx == 'start') && (MODE_ON==0)){
            MODE_ON = 1;
            date = new Date();
            console.log("External Start");
            console.log('Protocol type: ' + protocol_type);
            if(protocol_type == 1){ console.log("gamma: " + gamma);}
            if(protocol_type == 2){ console.log("alpha: " + alpha);}
            console.log("Agent's IP address: " + udp_numberIP);
            console.log("Date: " + date.getTime() );
            console.log(" ");
            file.appendFile(file_name,'\n');
            file.appendFile(file_name,'External Start.\n');
            file.appendFile(file_name,'Protocol type: ' + protocol_type + '\n');
            if(protocol_type == 1){ file.appendFile(file_name,"gamma: " + gamma + '\n');}
            if(protocol_type == 2){ file.appendFile(file_name,"alpha: " + alpha + '\n');}
            file.appendFile(file_name,"Agent's IP address: " + udp_numberIP + '\n');
            file.appendFile(file_name,'Date: ' + date.getTime() + '\n\n');
            
            file.appendFile(file_name, state + ";" + state_1 + ";" + state_2 + '\n');
        }
        
    }
);


//****************************************************************************//
//*** Define protocol functions **********************************************//
//****************************************************************************//

function protocol_I(x_i){
    
    var xplus_i;
    
    if(protocol_type == 1){
        xplus_i = x_i;
    }
    if(protocol_type == 2){
        xplus_i = alpha*x_i;
    }
    
    return xplus_i;
    
}

function protocol_J(x_i, x_j){
    
    var xplus_j;
    
    if(protocol_type == 1){
        xplus_j = gamma*x_j + (1-gamma)*x_i;
    }
    if(protocol_type == 2){
        xplus_j = x_j + x_i;
    }
    
    return xplus_j;
    
}

function protocol_RESULT(x_state_1, x_state_2){
    
    var x_consensus;
    
    if(protocol_type == 1){
        x_consensus = x_state_1;
    }
    if(protocol_type == 2){
        x_consensus = x_state_1/x_state_2;
    }
    
    return x_consensus;
    
}

function protocol_STOP(x_state, x_state_last){
    
    var mode_on_aux = MODE_ON;
    
    if(protocol_type == 1){
        if(Math.abs(x_state - x_state_last) < stop_value){
            mode_on_aux = 0; 
        }
    }
    if(protocol_type == 2){
        if(Math.abs(x_state - x_state_last) < stop_value){
            mode_on_aux = 0; 
        }
    }
    
    return mode_on_aux;
    
}


//Initial Print on console:
console.log('Waiting ...');
console.log(' ');

