/////////////////////////////////////////////////////////////
/////////// Get SETUP information: //////////////////////////
/////////////////////////////////////////////////////////////

//Use os and fs modules:
var os = require('os');
var file = require('fs');

//Get IPaddress of the agent:
var ifaces = os.networkInterfaces();
var myIPaddress = ifaces.eth0[1]["address"];

//Read the NODES.json information:
var dataFile = file.readFileSync("NODES.json");
var dataNodes = JSON.parse(dataFile);

//Get the data of the agent setup:
var neighbor       = dataNodes[myIPaddress]["neighbor"];
var initial_value  = dataNodes[myIPaddress]["initValue"];
var timer_interval = dataNodes[myIPaddress]["timeInterval"];


/////////////////////////////////////////////////////////////
/////////// The Non-Topology Information: ///////////////////
/////////////////////////////////////////////////////////////

//Constants for protocol:
var alpha = 0.5;
var number_neighbors = neighbor.length;
var N_plus_1 = number_neighbors + 1;

//UDP variables and objects:
var udp_port     = dataNodes["udpPort"];
var udp_datagram = require('dgram');
var udp_client   = udp_datagram.createSocket('udp6');
var udp_server   = udp_datagram.createSocket('udp6');

//Agent's state:
var zeta    = initial_value;
var sigma   = [];
var estigma = [];
var error   = [];
var timehop = [];	

var ye        = initial_value;
var sigmaye   = [];
var estigmaye = [];
var se        = 1;
var sigmase   = [];
var estigmase = [];
var zetayese  = ye/se;	
var errorye   = [];
var errorse   = [];

for (var i = 0; i < number_neighbors; i++){
  sigma[i]   = 0;
  estigma[i] = 0;
  error[i]   = 0;
  timehop[i] = 0;

  sigmaye[i]   = 0;
  estigmaye[i] = 0;
  sigmase[i]   = 0;
  estigmase[i] = 0;
  errorye[i]   = 0;
  errorse[i]   = 0;
}

//Operation mode:
var MODE_ON = 0;            //0: OFF,    1:ON
var TIME_RX = 0;	    //0: non-Rx, 1:yes-Rx

//Elements for debbuging:
var time_start;
var time;

//To write log file:
var file_name = 'RESULTS_' + myIPaddress.substring(9) + '.txt';
file.writeFile(file_name,'');


//****************************************************************************//
//*** Send UDP datagram to Someone *******************************************//
//****************************************************************************//

//Let broadcast transmission:
udp_client.bind( function(){ udp_client.setBroadcast(true) } );

//Set timer interval for Tx data:
setInterval(send_UDPdatagram, timer_interval);

//Each step, send UDP datagram:
function send_UDPdatagram(){

    if(MODE_ON == 1){

        //Update state BoffSchenato:
        var delta_ye = (ye/N_plus_1);
        var delta_se = (se/N_plus_1);
        ye   = delta_ye;
        se   = delta_se;
        zetayese = ye/se;

        //Multicast Transmission:
        for(var i = 0; i < number_neighbors; i++){

            //Update state BoffSchenato:
            sigmaye[i] = sigmaye[i] + delta_ye;
            sigmase[i] = sigmase[i] + delta_se;

            //Send actual state to the neighbor chosen:
            var chosenIPaddress = neighbor[i];
            var udp_message_Tx_TimerEvent = new Buffer('1;' + zeta + ';' + sigma[i] + ';' + estigma[i] + ";" + ye + ';' + sigmaye[i] + ';' + se + ';' + sigmase[i]);
            udp_client.send(
                udp_message_Tx_TimerEvent, 0, udp_message_Tx_TimerEvent.length, udp_port, chosenIPaddress,
                function(err,bytes){if(err){throw err;}});

        }

        //Detect the timehops:
        for (var i = 0; i < number_neighbors; i++){
            timehop[i] = timehop[i] + timer_interval;
        }

        //Write into log file:
        time = (new Date() - time_start);
        dataloggerWriteLine();

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

        //If external STOP is received, it changes operation mode to OFF:
        if((MODE_ON == 1) && (udp_message_Rx == 'stop')){
            //Change mode:
            MODE_ON = 0;
            //Write into log file:
            time = (new Date() - time_start);
            dataloggerWriteStopLine();
            //Proccess EXIT:
            process.exit();
        }

        //Receive only if this agent didn't send the datagram and operation mode is ON: (The last condition never happend)
        if((MODE_ON == 1) && (udp_message_Rx != 'start') && (udp_message_Rx != 'stop') && (udp_message_Rx != 'time')){

                //Recognize the agent who sent the message:
                var listenedIPaddress       = udp_Rx_info.address;
                var index_neighbor_listened = neighbor.indexOf(listenedIPaddress);

                //Get states from datagram:
                var string_received = udp_message_Rx.toString();
                var index_reference_1 = string_received.indexOf(";",0);
                var index_reference_2 = string_received.indexOf(";",(index_reference_1+1));
                var index_reference_3 = string_received.indexOf(";",(index_reference_2+1));
                var index_reference_4 = string_received.indexOf(";",(index_reference_3+1));
                var index_reference_5 = string_received.indexOf(";",(index_reference_4+1));
                var index_reference_6 = string_received.indexOf(";",(index_reference_5+1));
                var index_reference_7 = string_received.indexOf(";",(index_reference_6+1));
                var data_Rx_type    = 1*string_received.substring(0,index_reference_1);
                var data_Rx_zeta    = 1*string_received.substring(index_reference_1+1, index_reference_2);
                var data_Rx_sigma   = 1*string_received.substring(index_reference_2+1, index_reference_3);
                var data_Rx_estigma = 1*string_received.substring(index_reference_3+1, index_reference_4);
                var data_Rx_ye      = 1*string_received.substring(index_reference_4+1, index_reference_5);
                var data_Rx_sigmaye = 1*string_received.substring(index_reference_5+1, index_reference_6);
                var data_Rx_se      = 1*string_received.substring(index_reference_6+1, index_reference_7);
                var data_Rx_sigmase = 1*string_received.substring(index_reference_7+1);

                //Get the time:
                time = (new Date() - time_start);
                timehop[index_neighbor_listened] = 0;

                

                //Manipulated Variable:
                var zeta_corrected_own = zeta + data_Rx_sigma - estigma[index_neighbor_listened];
                var zeta_corrected_nei = data_Rx_zeta + sigma[index_neighbor_listened] - data_Rx_estigma;
                var delta_zeta = alpha*(zeta_corrected_own - zeta_corrected_nei);

                //Update State:
                error[index_neighbor_listened] = data_Rx_sigma - estigma[index_neighbor_listened] + sigma[index_neighbor_listened] - data_Rx_estigma;
                zeta = zeta_corrected_own - delta_zeta;
                sigma[index_neighbor_listened] = sigma[index_neighbor_listened] + delta_zeta;
                estigma[index_neighbor_listened] = data_Rx_sigma;

                //Update State BoffSchenato:
                errorye[index_neighbor_listened] = data_Rx_sigmaye - estigmaye[index_neighbor_listened];
                errorse[index_neighbor_listened] = data_Rx_sigmase - estigmase[index_neighbor_listened];
                ye = ye + data_Rx_sigmaye - estigmaye[index_neighbor_listened];
                estigmaye[index_neighbor_listened] = data_Rx_sigmaye;
                se = se + data_Rx_sigmase - estigmase[index_neighbor_listened];
                estigmase[index_neighbor_listened] = data_Rx_sigmase;
                zetayese = ye/se;

                //Write into log file:
                dataloggerWriteLine();

                

        }

        //If external START is received, it changes operation mode to ON:
        if((MODE_ON == 0) && (TIME_RX == 1) && (udp_message_Rx == 'start')){
            //Change mode:
            MODE_ON = 1;
            //Define the time for debugging:
            //time_start = new Date();
            //Write into log file:
            time = (new Date() - time_start);
            dataloggerWriteLine();
        }

        //To define the absolute initial time:
        if((TIME_RX == 0) && (udp_message_Rx == 'time')){
            //Change mode:
            TIME_RX = 1;
            //Define initial absolute time:
            time_start = new Date();
            //Write into log file:
            time = (new Date() - time_start);
            dataloggerWriteLine();
        }


    }
);


//****************************************************************************//
//*** Define auxiliary functions *********************************************//
//****************************************************************************//

function dataloggerWriteLine(){
    var dataLine = time + ";" + zeta + ";";
    for (var i = 0; i < number_neighbors; i++){dataLine = dataLine + error[i] + ";";}
    for (var i = 0; i < number_neighbors; i++){dataLine = dataLine + timehop[i] + ";";}
    for (var i = 0; i < number_neighbors; i++){dataLine = dataLine + sigma[i] + ";";}
    for (var i = 0; i < number_neighbors; i++){dataLine = dataLine + estigma[i] + ";";}
    dataLine = dataLine + zetayese + ";" + ye + ";" + se + ";";
    for (var i = 0; i < number_neighbors; i++){dataLine = dataLine + errorye[i] + ";";}
    for (var i = 0; i < number_neighbors; i++){dataLine = dataLine + errorse[i] + ";";}
    dataLine = dataLine + '\n';
    file.appendFile(file_name, dataLine);
}

function dataloggerWriteStopLine(){
    var dataLine = time + ";" + zeta + ";";
    for (var i = 0; i < number_neighbors; i++){dataLine = dataLine + error[i] + ";";}
    for (var i = 0; i < number_neighbors; i++){dataLine = dataLine + timehop[i] + ";";}
    for (var i = 0; i < number_neighbors; i++){dataLine = dataLine + sigma[i] + ";";}
    for (var i = 0; i < number_neighbors; i++){dataLine = dataLine + estigma[i] + ";";}
    dataLine = dataLine + zetayese + ";" + ye + ";" + se + ";";
    for (var i = 0; i < number_neighbors; i++){dataLine = dataLine + errorye[i] + ";";}
    for (var i = 0; i < number_neighbors; i++){dataLine = dataLine + errorse[i] + ";";}
    dataLine = dataLine + "STOP;\n";
    file.appendFileSync(file_name, dataLine);
}



