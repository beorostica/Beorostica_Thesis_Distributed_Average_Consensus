The file "Tx_Rx_udp_datagram.js" is a Node.js excecutable.

This file must be stored on each of the 6 beaglebone black BBB (or any similar like raspberry).

Once every node has the file, it is necessary to set the following:
- var udp_numberIP
- var state   

- var state_1
which will depend on the IP address of the node and the desired initial momentum of the agents.

Note that this experiment just regard a complete feasible communication topology, which is given by setting 
the broadcast direccion "XXX.XXX.XXX.255". If another topology is desired, it is necessary to set the IP addresses
of the neighbors to send information directly.

Note that in order to start the experiment, all the 6 BBB must be running the file, then an external device (a computer)
must send a udp message to the broadcast direction with the content 'start'. If you want to stop the experiment, just send 
the message 'stop' to the broadcast direction.