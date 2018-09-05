Neccessary files to execute the Multicast Version of the designed protocol 
along with the Push-Sum based protocol (https://www.sciencedirect.com/science/article/pii/S240589631730126X)
in the FIT IoT Laboratory.

Just run the file "IoTLab_run.js".

You must change the following:
var user = 'orostica';

var password = 'Il-UvZvd';

You can change the following:
var numberGroup = 1;			//number of groups that starts after 30s.
var numNodes   = ["5","5","5","5"];	//number of nodes taken from eachy France City of the A8 nodes
var maxEbranch = 3;    			//maximum number of neighbors per agent (more than or equal to 2)
var E = 100;	       			//number edges, from (N-1) to N(N-1)/2