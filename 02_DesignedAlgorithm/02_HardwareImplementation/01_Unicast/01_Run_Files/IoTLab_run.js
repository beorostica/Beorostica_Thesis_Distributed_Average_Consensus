//Import Modules:
var cmd = require('node-command-line');
var Promise = require('bluebird');
var fs = require('fs');

//Parameters and variables:
var expName = "IoTLab_Beorostica_Protocol_Test";
var protocolDuration = "2m";
var expDuration = "60";		//expDuration > protocolDuration + 6m
var maxEtrunk = 2;              //maximum number of edges per node of the trunk
var maxEbranch = 3;//4             //maximum number of edges per node of the branches, maxEbranch > maxEtrunk
var E = 100;	                //number edges, from (N-1) to N(N-1)/2
var expId;
var expStatus;
var auxDataBoot0 = [];
var auxDataBoot1 = [];
var nodeReliable = [];
var nodeUnreliable = [];
var nodeID = [];
var nodeIPv6Address = [];
var nodeRealAverage;
var nodeInitialValue = [];
var nodeTimeInterval = [];
var nodeSite = [];
var nodeObject = {};
var siteFrance = ["grenoble","saclay","strasbourg","paris"];
var numNodes   = ["5","5","5","5"];//["99","140","13","60"];
var prefixIPv6 = ["2001:660:5307:3000::","2001:660:3207:400::","2001:660:4701:f080::","2001:660:330f:a200::"];
var nodeIDs    = ["","","",""];
var numberGroup = 1;
var countFile  = 6;
var udpPort = 4000;
var user = 'orostica';
var password = 'Il-UvZvd';

//Execute commands sequentially:
function runCommandsSequentially() {
    Promise.coroutine(function* () {

        //Remove all past files and Results:
        console.log("Removing past files and results ...")
        yield cmd.run("rm IoTLab_1_authentication.json");
        yield cmd.run("rm IoTLab_2_submit.json");
        yield cmd.run("rm IoTLab_3_status.json");
        yield cmd.run("rm IoTLab_4_boot.json");
        yield cmd.run("rm IoTLab_5_connection.json");
        for (var i in siteFrance) {
            yield cmd.run("rm IoTLab_" + countFile + "_running_" + siteFrance[i] + ".json");
            countFile = countFile + 1;
        }
        yield cmd.run("rm IoTLab_" + countFile + "_running_start_signal.json");
        countFile = countFile + 1;
        yield cmd.run("rm IoTLab_" + countFile + "_running_stop_signal.json");
        countFile = 6;
        yield cmd.run("rm NODES.json");
        yield cmd.run("rm -r RESULTS");
        fs.writeFile('IoTLab_shell_commands.sh','#!/bin/bash\n\n');

        //Removing all files inside the A8 folder in France Front-ends:
        for (var i in siteFrance) {yield cmd.run('ssh ' + user + '@' + siteFrance[i] + '.iot-lab.info "rm -rf A8/*"');}

        //Authentication:
	yield cmd.run("iotlab-auth -u " + user + " -p " + password + " > IoTLab_1_authentication.json");
	var data_authentication = fs.readFileSync("IoTLab_1_authentication.json");
	var dataAuthentication = JSON.parse(data_authentication);
        console.log("Authentication: " + dataAuthentication);

	if (dataAuthentication == "Written") {

            //Submit Experiment (get experiment ID):
            var submitString = "iotlab-experiment submit -n " + expName + " -d " + expDuration;
            for (var i in siteFrance){submitString = submitString + " -l " + numNodes[i] + ",archi=a8:at86rf231+site=" + siteFrance[i];}
            submitString = submitString + " > IoTLab_2_submit.json";
            yield cmd.run(submitString);
            var data_submit = fs.readFileSync("IoTLab_2_submit.json");
            var dataSubmit = JSON.parse(data_submit);
            expId = dataSubmit.id;
            console.log("expId: " + expId);

            //Wait until Running Status:
            console.log(" ");
            console.log("Waiting until Running Status ...");
            yield cmd.run("iotlab-experiment wait -i " + expId + " > IoTLab_3_status.json");
            var data_status = fs.readFileSync("IoTLab_3_status.json");
            var dataStatus = JSON.parse(data_status);
            expStatus = dataStatus;
            console.log("expStatus: " + expStatus);

            //Get boot information:
            yield cmd.run("iotlab-experiment get -i " + expId + " -p > IoTLab_4_boot.json");
            var data_boot = fs.readFileSync("IoTLab_4_boot.json");
            var dataBoot = JSON.parse(data_boot);
            auxDataBoot0 = dataBoot.deploymentresults['0'];
            auxDataBoot1 = dataBoot.deploymentresults['1'];
            console.log("Correctly booted nodes:");
            for (var i in auxDataBoot0) {console.log(auxDataBoot0[i]);}
            console.log(" ");
            console.log("Not properly booted nodes:");
            for (var i in auxDataBoot1) {console.log(auxDataBoot1[i]);}

            if (expStatus == "Running") {

                //Check the nodes available by SSH connection:
                console.log(" ");
                console.log("Waiting until SSH connections are verified ...");  
                yield cmd.run("iotlab-ssh -i " + expId + " wait-for-boot > IoTLab_5_connection.json");          
		var data_connection = fs.readFileSync("IoTLab_5_connection.json");
                var dataConnection = JSON.parse(data_connection);
                nodeReliable = dataConnection['wait-for-boot']['0'];
                nodeUnreliable = dataConnection['wait-for-boot']['1'];
                console.log("Correctly SSH connected nodes:");
                for (var i in nodeReliable) {console.log(nodeReliable[i]);}
                console.log(" ");
                console.log("Not SSH connected nodes:");
                for (var i in nodeUnreliable) {console.log(nodeUnreliable[i]);}

                //Randomize-Shuffle the array of reliable nodes:
                nodeReliable = shuffle(nodeReliable);
                console.log(" ");
                console.log("Correctly SSH connected nodes RANDOMIZED:");
                for (var i in nodeReliable) {console.log(nodeReliable[i]);}

                //Choose three groups:
                var valueInterval = Math.floor(100/numberGroup);
                var valuesGroup = [0];
                var numberAgentGroup = Math.ceil(nodeReliable.length/numberGroup);
                for (var i = 1; i < (numberGroup+1); i++) {
                    valuesGroup[i] = i*valueInterval;
                }
                console.log("valuesGroup = " + valuesGroup);

                //Get the global nodeObject of the Randomized-Realiable nodes:
                for (var i = 0; i < nodeReliable.length; i++) {

                    //Getting the site of the node:
                    var nodeData = nodeReliable[i];
                    var nodeDataArray = nodeData.split('.');
                    nodeSite[i] = nodeDataArray[1];

                    //Getting the number of the node in its LAN:
                    var idData = nodeDataArray[0];
                    var idDataArray = idData.split('-');
                    nodeID[i] = idDataArray[2];

                    //Getting the public IPv6 address:
                    var nodeIDint = parseInt(nodeID[i]);
                    var nodeIDhex = nodeIDint.toString(16);
                    var indexSite = siteFrance.indexOf(nodeSite[i]);
                    nodeIPv6Address[i] = prefixIPv6[indexSite] + nodeIDhex;

                    //Creating the nodeObject:
                    var agentGroup = Math.floor(i/numberAgentGroup);
                    if (agentGroup >= numberGroup) {
                        agentGroup = numberGroup-1;
                    }
                    nodeInitialValue[i] = getRandomIntInclusive(valuesGroup[agentGroup],valuesGroup[agentGroup+1]);
                    console.log(i + ", agentGroup: " + agentGroup + ", nodeInitialValue[i]: " + nodeInitialValue[i]);
                    nodeTimeInterval[i] = 500*getRandomIntInclusive(1,3);
                    nodeObject[nodeIPv6Address[i]] = {dnsLAN: nodeData,
                                                      site: nodeSite[i],
                                                      idLAN: nodeID[i],
                                                      ipv6Addr: nodeIPv6Address[i],
                                                      initValue: nodeInitialValue[i],
                                                      timeInterval: nodeTimeInterval[i],
                                                      neighbor: []};

                    //Creating an string with the nodesIDs sepated by site:
                    nodeIDs[indexSite] = nodeIDs[indexSite] + nodeID[i] + '+';

                }

                //Removing the last character '+' of nodesIDs:
                for (var i in nodeIDs) {nodeIDs[i] = nodeIDs[i].slice(0,-1);}
                console.log("");
                console.log("LAN IDs by site:");
                for (var i in nodeIDs) {console.log("IDs " + siteFrance[i] + ": " + nodeIDs[i]);}


                //Put the nodes address all together in the nodeObject:
                nodeObject.ipv6Address = nodeIPv6Address;
                console.log("");
                console.log("Nodes IPv6 Address: ");
                console.log(nodeObject.ipv6Address);

                //Put the number of groups:
                nodeObject.numberGroups = numberGroup;
                console.log("");
                console.log("Nodes Groups: ");
                console.log(nodeObject.numberGroups);

                //Put the Average of the initial values in the nodeObject:
                var auxSum = nodeInitialValue.reduce((previous, current) => current += previous);
                nodeRealAverage = auxSum / nodeInitialValue.length;
                nodeObject.realAverage = nodeRealAverage;
                console.log("");
                console.log("Real Average Value: " + nodeRealAverage);

                //Put the udpPort:
                nodeObject.udpPort = udpPort;
                console.log("");
                console.log("UDP port: ");
                console.log(nodeObject.udpPort);

                ////////////////////////////////////////////////////////////////////////////////////////////////////
                ////////////////////////////////////////////////////////////////////////////////////////////////////
                //Define the Topology (Circular Topology) and Put it in the nodeObject:
                var N = nodeIPv6Address.length;
                //nodeObject[nodeIPv6Address[0]]["neighbor"]   = [nodeIPv6Address[N-1],nodeIPv6Address[1]];
                //nodeObject[nodeIPv6Address[N-1]]["neighbor"] = [nodeIPv6Address[N-2],nodeIPv6Address[0]];
                //for (var i = 1; i < (N-1); i++) {
                //    nodeObject[nodeIPv6Address[i]]["neighbor"] = [nodeIPv6Address[i-1],nodeIPv6Address[i+1]];
                //}

		//Define the nodes:
		var graph = {node:[], neighbor:{}};
		for (var i = 0; i < N; i++) {
		    graph.node[i] = nodeIPv6Address[i]
    		    graph.neighbor[graph.node[i]] = [];}

		//Generate an spanning tree (connected graph):
		var nodeMaxTrunk = [];
		for (var i in graph.node) {
		    if (i != 0) {
		        nodeMaxTrunk.push(graph.node[i-1]);
		        var j = getRandomIntInclusive(0,nodeMaxTrunk.length-1);
		        graph.neighbor[graph.node[i]].push(nodeMaxTrunk[j]);
		        graph.neighbor[nodeMaxTrunk[j]].push(graph.node[i]);
		        if (graph.neighbor[nodeMaxTrunk[j]].length == maxEtrunk) {
		            nodeMaxTrunk.splice(nodeMaxTrunk.indexOf(nodeMaxTrunk[j]),1);}}}

		//Add the rest of edges:
		var nodeMaxBranch = [];
		for (var i in graph.node) {
		    if (graph.neighbor[graph.node[i]].length < maxEbranch) {
		        nodeMaxBranch.push(graph.node[i]);}}

		//Add until complete the total edges without exceding the maximum per node:
		var k = 0;
		while ((k < (E-N+1)) && (nodeMaxBranch.length > 1)) {
		    var i = getRandomIntInclusive(0,nodeMaxBranch.length-1);
		    var node_i = nodeMaxBranch[i];
		    if (graph.neighbor[node_i].length + 1 >= maxEbranch) {
		        nodeMaxBranch.splice(nodeMaxBranch.indexOf(nodeMaxBranch[i]),1);}
		    var j = getRandomIntInclusive(0,nodeMaxBranch.length-1);
		    var node_j = nodeMaxBranch[j];
		    var cnt = 0;
		    while (((graph.neighbor[node_i].indexOf(node_j) != -1) || (node_i == node_j))&&(cnt < 10000)) {
		        cnt++;
		        console.log(cnt);
		        j = getRandomIntInclusive(0,nodeMaxBranch.length-1);
		        node_j = nodeMaxBranch[j];}
		    if (cnt < 10000) {
		        if (graph.neighbor[node_j].length + 1 >= maxEbranch) {
		            nodeMaxBranch.splice(nodeMaxBranch.indexOf(nodeMaxBranch[j]),1);}
			        graph.neighbor[node_i].push(node_j);
		        graph.neighbor[node_j].push(node_i);
		    }
		    k++;
		}

                for (var i = 0; i < N; i++) {
                    nodeObject[nodeIPv6Address[i]]["neighbor"] = graph.neighbor[graph.node[i]];
                }

                //////////////////////////////////////////////////////////////////////////////////////////////////////
                //////////////////////////////////////////////////////////////////////////////////////////////////////


                //Write the nodeObject on a .json file:
                fs.writeFile("NODES.json", JSON.stringify(nodeObject, null, 4));

                //Send Files to the Front-ends:
                console.log("");
                console.log("Sending Files to the France Front-Ends ...");
                for(var i in siteFrance){
                    yield cmd.run('scp NODES.json IoTLab_protocol.js IoTLab_start_signal.js IoTLab_stop_signal.js ' +
                                  user + '@' + siteFrance[i] + '.iot-lab.info:A8/');
                    console.log("Files sended to: " + siteFrance[i]);
                }

                //Write the IoTLab_shell_commands.sh to be executed later:
                for (var i in siteFrance) {
                    fs.appendFile('IoTLab_shell_commands.sh','iotlab-ssh --verbose run-cmd ' +
                                  '"cd A8 && node IoTLab_protocol.js" -l ' + siteFrance[i] + ',a8,' + nodeIDs[i] +
                                  ' > IoTLab_' + countFile + '_running_' + siteFrance[i]  + '.json &\n');
                    countFile = countFile + 1;
                }
                fs.appendFile('IoTLab_shell_commands.sh','sleep 1m\n');
                //fs.appendFile('IoTLab_shell_commands.sh','iotlab-ssh --verbose run-cmd \"cd A8 && node IoTLab_start_signal.js\" ' +
                //              '--frontend\n');
                fs.appendFile('IoTLab_shell_commands.sh','iotlab-ssh --verbose run-cmd \"cd A8 && node IoTLab_start_signal.js\" ' +
                              '--frontend > IoTLab_' + countFile  + '_running_start_signal.json\n');
                countFile = countFile + 1;
                fs.appendFile('IoTLab_shell_commands.sh','sleep ' + protocolDuration + '\n');
                //fs.appendFile('IoTLab_shell_commands.sh','iotlab-ssh --verbose run-cmd \"cd A8 && node IoTLab_stop_signal.js\" ' +
                //              '--frontend\n');
                fs.appendFile('IoTLab_shell_commands.sh','iotlab-ssh --verbose run-cmd \"cd A8 && node IoTLab_stop_signal.js\" ' +
                              '--frontend > IoTLab_' + countFile + '_running_stop_signal.json\n');

                //Run the IoTLab_shell_commands.sh, ie. every node in france runs the protocol:
                console.log("");
                console.log("Nodes in France are running the protocol ...");
                yield cmd.run("chmod 777 IoTLab_shell_commands.sh");
                yield cmd.run('./IoTLab_shell_commands.sh');

                //Stop Experiment to release the IoTLab resources:
                yield cmd.run('iotlab-experiment stop -i ' + expId);

		//Receiving results from the Front-ends:
                console.log("");
                console.log("Receiving Results from Front-ends ...");
                console.log("");
                for (var i in siteFrance) {
                    yield cmd.run("scp -r " + user + "@" + siteFrance[i] + ".iot-lab.info:~/A8/ ~/RESULTS_" + siteFrance[i]);
                }

                //Keep just the Results en the RESULTS_site FOLDERS:
                for (var i in siteFrance) {
                    yield cmd.run("rm RESULTS_" + siteFrance[i]  + "/IoTLab_protocol.js");
                    yield cmd.run("rm RESULTS_" + siteFrance[i]  + "/IoTLab_start_signal.js");
                    yield cmd.run("rm RESULTS_" + siteFrance[i]  + "/IoTLab_stop_signal.js");
                    yield cmd.run("rm RESULTS_" + siteFrance[i]  + "/NODES.json");
                }

                //Create just one folder RESULTS with the data:
                yield cmd.run("mkdir RESULTS");
                for (var i in siteFrance) {
                    yield cmd.run("mv -v RESULTS_" + siteFrance[i] + "/* ~/RESULTS/");
                    yield cmd.run("rm -r RESULTS_" + siteFrance[i]);
                }

                //Send a final message:
                console.log("");
                console.log("Experiment Ended! :)");

                //Ploting the results:
                yield cmd.run("chmod 777 IoTLab_display_results.py");
                yield cmd.run("./IoTLab_display_results.py");

            }
        }
    })();
}


//Auxiliary function to randomize an array:
function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array;
}

//Auxiliary funcion to get random integers between an interval:
function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    //The maximum is inclusive and the minimum is inclusive
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//Execute the main function:
runCommandsSequentially();

