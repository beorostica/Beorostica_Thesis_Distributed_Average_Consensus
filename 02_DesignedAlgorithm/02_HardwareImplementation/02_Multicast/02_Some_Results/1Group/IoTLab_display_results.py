#!/usr/bin/python

#Importing modules:
import os
import json
import math
import matplotlib.pyplot as plt
plt.figure(figsize=(20.0, 10.0))

#Reading NODES.json:
fp = open("NODES.json")
nodesData = json.load(fp)
fp.close()

#Getting some information of nodesData:
number_nodes = str(len(nodesData["ipv6Address"]))

#Detected the nodes which created a log file:
nodesDetected = []
for fileName in os.listdir("RESULTS/"):
    nodeId =  "2001:660:" + fileName[fileName.find("_")+1:fileName.find(".")]
    nodesDetected.append(nodeId)
nodesNotDetected = []
for nodeAddress in nodesData["ipv6Address"]:
    if nodeAddress not in nodesDetected:
        nodesNotDetected.append(nodeAddress)
print "Nodes Not Detected"
print nodesNotDetected

#Declaring some global variables:
timeFinalLargest = 0
boolStop  = True
nodesNotStopped = []
counterNaN = 0

#Selecting each file in the folder RESULTS:
for fileName in os.listdir("RESULTS/"):

    #Opening a file:
    fp = open('RESULTS/' + fileName, 'r')

    #Reading the number of neighbors:
    nodeId =  "2001:660:" + fileName[fileName.find("_")+1:fileName.find(".")]
    numberNeighbors = len(nodesData[nodeId]["neighbor"])
    offset = (4*numberNeighbors)+2

    #Declaring de variables time and zeta of the agent:
    time = []
    zeta = []
    errorMatrix = []
    zetayese = []
    ye   = []
    se   = []
    erroryeMatrix = []
    errorseMatrix = []
    hopMatrix = []

    #Reading the whole file line by line:
    cnt = 0
    line = fp.readline()
    while line:

        #Split the line:
        data = line.split(";")
        #Get time and momentum:
        time.append(float(data[0])/1000)
        zeta.append(float(data[1]))
        #Get error:
        errors = []
        for i in range(2,2+numberNeighbors):
            errors.append(float(data[i]))
        errorMatrix.append(errors)
        #Get time of hops:
        hops = []
        for i in range(2+numberNeighbors,2+(2*numberNeighbors)):
            hops.append(float(data[i])/1000)
        hopMatrix.append(hops)

        #Get zetayese, ye and se:
        zetayese.append(float(data[offset]))
        ye.append(float(data[offset+1]))
        se.append(float(data[offset+2]))
        #Get errorye:
        errorsye = []
        for i in range(offset+3,offset+3+numberNeighbors):
            errorsye.append(float(data[i]))
        erroryeMatrix.append(errorsye)
        #Get errorse:
        errorsse = []
        for i in range(offset+3+numberNeighbors,offset+3+(2*numberNeighbors)):
            errorsse.append(float(data[i]))
        errorseMatrix.append(errorsse)

        #Read the next line:
        line = fp.readline()
        cnt += 1

    #Print if every agent received stop signal:
    if (data[-2] != "STOP"):
        boolStop = False
        nodesNotStopped.append(nodeId)

    #Transposing the error and hop matrices:
    error = []
    errorye = []
    errorse = []
    hop = []
    for i in range(numberNeighbors):
        error.append([])
        errorye.append([])
        errorse.append([])
        hop.append([])
        for j in range(len(time)):
            error[i].append(errorMatrix[j][i])
            errorye[i].append(erroryeMatrix[j][i])
            errorse[i].append(errorseMatrix[j][i])
            hop[i].append(hopMatrix[j][i])

    #Closing the file:
    fp.close()

    if (len(time) > 0):

        #Saving the plot for zeta:
        plt.subplot(4,2,1)
        plt.step(time, zeta)
        #Saving the plot for error:
        plt.subplot(4,2,3)
        for i in range(numberNeighbors):
            plt.step(time, error[i])
        #Saving the plot for hop:
        plt.subplot(4,2,5)
        for i in range(numberNeighbors):
            if nodesData[nodeId]["neighbor"][i] in nodesDetected:
                plt.step(time, hop[i])
        #Saving plot for time:
        plt.subplot(4,2,7)
        plt.plot([time[-1], time[-1]],[-1, 1])

        #Saving the plot for zeta:
        plt.subplot(4,2,2)
        plt.step(time, zetayese)
        #Saving the plot for error:
        plt.subplot(4,2,4)
        #plt.step(time, ye, 'r')
        plt.step(time, se, 'b')
        #Saving the plot for hop:
        plt.subplot(4,2,6)
        for i in range(numberNeighbors):
            if nodesData[nodeId]["neighbor"][i] in nodesDetected:
                plt.step(time, hop[i])
        #Saving plot for time:
        plt.subplot(4,2,8)
        plt.plot([time[-1], time[-1]],[-1, 1])

        #Print the final value:
        print  nodeId.ljust(24) + repr(zeta[-1]).ljust(24) + repr(zetayese[-1]).ljust(24) + repr(ye[-1]).ljust(24) + repr(se[-1]).ljust(24)

        #Counter NaN:
        if math.isnan(zetayese[-1]):
            counterNaN = counterNaN + 1

        #Save the largest final time:
        if timeFinalLargest < time[-1]:
            timeFinalLargest = time[-1]

    else:
        nodesDetected.remove(nodeId)
        nodesNotDetected.append(nodeId)
        print nodeId

#Calculating the real average considering the nodes detected:
sumNodes = float(0)
numNodes = float(len(nodesDetected))
for i in nodesDetected:
    sumNodes = sumNodes + float(nodesData[i]["initValue"])
zetaReal = sumNodes/numNodes

#Print real average:
print "Real Average: " + repr(zetaReal)

#Print if every agent recived the STOP signal:
print "Every agent recieved stop signal?: " + str(boolStop)
print nodesNotStopped

#Plotin for Zeta:
plt.subplot(4,2,1)
plt.step([0, timeFinalLargest],[zetaReal, zetaReal],'k', label='Real Average')
plt.legend()
plt.ylabel('Zeta')
plt.title('Results France IoTLab. Beorostica Protocol.\n' + number_nodes + ' Nodes. ' + str(numberNeighbors) + ' Neighbors.')
#Ploting for Error:
plt.subplot(4,2,3)
plt.step([0, timeFinalLargest],[0, 0],'k')
plt.ylabel('Error')
#Ploting for Hops:
plt.subplot(4,2,5)
plt.step([0, timeFinalLargest],[0, 0],'k')
plt.ylabel('Hops (s)')
#Ploting for Time:
plt.subplot(4,2,7)
plt.step([0, timeFinalLargest],[0, 0],'k')
plt.ylabel('Final Time')
plt.xlabel('Time (s)')

#Plotin for Zeta:
plt.subplot(4,2,2)
plt.step([0, timeFinalLargest],[zetaReal, zetaReal],'k', label='Real Average')
plt.legend()
plt.ylabel('Zeta')
plt.title('Results France IoTLab. BoffSchenato Protocol.\n' + number_nodes + ' Nodes. ' + str(numberNeighbors) + ' Neighbors. (' + str(counterNaN) + ' Nodes NaN).')
#Ploting for Error:
plt.subplot(4,2,4)
plt.step([0, timeFinalLargest],[0, 0],'k')
plt.ylabel('y , s')
#Ploting for Hops:
plt.subplot(4,2,6)
plt.step([0, timeFinalLargest],[0, 0],'k')
plt.ylabel('Hops (s)')
#Ploting for Time:
plt.subplot(4,2,8)
plt.step([0, timeFinalLargest],[0, 0],'k')
plt.ylabel('Final Time')
plt.xlabel('Time (s)')

#Save and Show plot: 
plt.savefig('Results_' + number_nodes +'_nodes_' + str(numberNeighbors) + '_neighbors.png')
plt.show()


