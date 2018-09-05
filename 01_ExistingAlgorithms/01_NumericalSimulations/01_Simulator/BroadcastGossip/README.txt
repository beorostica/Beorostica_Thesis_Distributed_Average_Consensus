This folder contains the necessary files to simulate the Broadcast-Gossip protocol 
with an Hybrid simulator HyEQ made by Sanfelice (https://hybrid.soe.ucsc.edu/software).

Just run the "run.m" file. The output will be "DataBroadcastGossip_top_X_freq_Y.mat" files and the 
file "DataBroadcastGossipGeneral.mat" which contain the results of the simulations:
-DataBroadcastGossip_top_1_freq_1.mat
-DataBroadcastGossip_top_1_freq_2.mat
-DataBroadcastGossip_top_1_freq_3.mat
-DataBroadcastGossip_top_1_freq_4.mat
-DataBroadcastGossip_top_2_freq_1.mat
-DataBroadcastGossip_top_2_freq_2.mat
-DataBroadcastGossip_top_2_freq_3.mat
-DataBroadcastGossip_top_2_freq_4.mat
-DataBroadcastGossipGeneral.mat

The "run.m" calls the simulink file "Hybrid_Model_BroadcastGossip.slx". Every time there is a realization
of the simulation, the simulink file requires the following parameters:
- A feasible communication Topology (given by "topology_matrix")
- A type of timer frequencies (given by "type_timer_frequencies")
- A reception probability (given by "reception_probability")

Two topologies (feasible communication topologies) are regarded:
- Complete (all-to-all).
- Every node has three neighbors.
Four types of timer frequencies are considered:
- Every node has the same frequency.
- Every node has nominally the same frequency.
- The nodes with lower initial conditions have lower frequencies.
- The nodes with lower initial conditions have higher frequencies.
19 different reception probabilities:
- 1, 0.95, 0.9, 0.85, 0.8, ..., 0.15, 0.1.

A total of 100 simulations are excuted for a given topology, a given frequency type and
a given reception probability. The simulation running "run.m" takes a long time, so it is advisable
to change a little bit the code to run the file by parts. I mean, instead of generate all the 
previous listed files, is better to generate just one file. For instance, to generate 
the file "DataBroadcastGossip_top_2_freq_3.mat", change this:
...
for n_topology = 1:number_topologies
%for n_topology = 2:2
...
    for n_type_timer_frequencies = 1:number_frequencies
    %for n_type_timer_frequencies = 3:3
...
to this:
...
%for n_topology = 1:number_topologies
for n_topology = 2:2
...
    %for n_type_timer_frequencies = 1:number_frequencies
    for n_type_timer_frequencies = 3:3
...
