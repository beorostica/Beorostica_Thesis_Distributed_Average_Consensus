
%Reset all:
close all;
clear, clc;
addpath('Helpful_Functions');

%Parameters for Integrator System:
T    = 25;          %t in [0,T]
J    = 1500;        %j in {0,1,...,J}
rule = 1;           %rule (see simulink)

%Constants:
number_nodes           = 6;
number_timers_per_node = 1;
number_values_per_node = 2;
number_timers = number_timers_per_node*number_nodes;
number_values = number_values_per_node*number_nodes;


%User can change topologies values!!!:
topology_matrix_1 = [0  1  1  1  1  1;    
                     1  0  1  1  1  1;
                     1  1  0  1  1  1;
                     1  1  1  0  1  1;
                     1  1  1  1  0  1;
                     1  1  1  1  1  0];
topology_matrix_2 = [0  1  1  0  1  1;    
                     1  0  1  0  0  1;
                     1  1  0  1  0  0;
                     0  0  1  0  1  1;
                     1  0  0  1  0  1;
                     1  1  0  1  1  0]; 
topology_matrix_matrix        = zeros(number_nodes, number_nodes, 2);
topology_matrix_matrix(:,:,1) = topology_matrix_1;
topology_matrix_matrix(:,:,2) = topology_matrix_2;
number_topologies = length(topology_matrix_matrix(1,1,:));

%Type of frequencies to select:
type_timer_frequencies_vector = [1 2 3 4];
number_frequencies = length(type_timer_frequencies_vector);

%User can change receive probabilities values!!!:
reception_probability_vector = 1:-0.05:0.1;
number_probabilities = length(reception_probability_vector);

%Auxiliar strings to save data:
str1 = 'DataPushSum_top_';
str2 = '_freq_';
str3 = '.mat';

%Variable timer phases:
values0_1    = [10, 25, 40, 60, 75, 90];                            %Initial values for numerator
values0_2    = [1 ,  1,  1,  1,  1,  1];                            %Initial values for denominator
values0      = reshape([values0_1;values0_2],[1 number_values])';   %Initial state of values
x0           = [2*pi*rand(number_timers,1); values0];                    %Initial state
real_average = mean(values0_1);                                     %Real average

%Total simulations:
number_simulations = 100;

for n_topology = 1:number_topologies
%for n_topology = 2:2
    topology_matrix = squeeze(topology_matrix_matrix(:,:,n_topology));

    for n_type_timer_frequencies = 1:number_frequencies
    %for n_type_timer_frequencies = 3:3
        type_timer_frequencies = type_timer_frequencies_vector(n_type_timer_frequencies);

        %For each topology and each frecuency, create results:
        values_pushsum_consensus = zeros(number_timers, number_simulations, number_probabilities);
        
        tic
        for n_probability = 1:number_probabilities
        %for n_probability = 15:15
            reception_probability = reception_probability_vector(n_probability);

            for n_simulation = 1:number_simulations
            
                %Variable timer phases on initial state:
                x0 = [2*pi*rand(number_timers,1); values0];    %Initial state

                %Simulate:
                sim('Hybrid_Model_PushSum');

                %Get values from the state:
                x_values     = x(length(x(:,1)), number_timers+1: number_timers+number_values);
                x_values_aux = reshape(x_values, [2 number_timers]);
                x_values_1   = x_values_aux(1,:);
                x_values_2   = x_values_aux(2,:);
                values_final = x_values_1./x_values_2;
                values_pushsum_consensus(:, n_simulation, n_probability) = values_final;
                
            end
        end
        toc
        
        %Save data:
        save( strcat(str1, num2str(n_topology), str2, num2str(n_type_timer_frequencies), str3) , ...
              'values_pushsum_consensus');
        
    end
end

%Save general data parameters:
save( 'DataPushSumGeneral', 'number_topologies', 'number_frequencies', 'number_probabilities', 'number_timers', 'number_simulations'...
                                  , 'topology_matrix_matrix', 'type_timer_frequencies_vector', 'reception_probability_vector', 'real_average');
                              

