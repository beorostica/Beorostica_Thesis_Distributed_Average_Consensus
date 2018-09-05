
%Reset all:
close all;
clear, clc;
addpath('Data');

%Load general data:
load('DataBroadcastGossipGeneral.mat');
load('DataPushSumGeneral.mat');

%Matrix that contains all data:
values_gossip  = zeros(number_topologies, number_frequencies, number_timers, number_simulations, number_probabilities);
values_pushsum = zeros(number_topologies, number_frequencies, number_timers, number_simulations, number_probabilities);

%Load results:
str1_gossip  = 'DataBroadcastGossip_top_';
str1_pushsum = 'DataPushSum_top_';
str2         = '_freq_';
str3         = '.mat';
for n_topology = 1:number_topologies
    for n_type_timer_frequencies = 1:number_frequencies
        load( strcat(str1_gossip , num2str(n_topology), str2, num2str(n_type_timer_frequencies), str3) );
        load( strcat(str1_pushsum, num2str(n_topology), str2, num2str(n_type_timer_frequencies), str3) );
        values_gossip(n_topology, n_type_timer_frequencies, :, :, :) = values_gossip_consensus;
        values_pushsum(n_topology, n_type_timer_frequencies, :, :, :) = values_pushsum_consensus;
    end
end

%%
%Plot All: Consensus vs Reception Probability:
for n_topology = 1:number_topologies
    figure;
    for n_type_timer_frequencies = 1:number_frequencies
        
        selected_topology         = n_topology;      
        selected_frequency_vector = n_type_timer_frequencies;      
        for selected_reception_pencentage = 1:number_probabilities

            values_selected_gossip  = squeeze(values_gossip(selected_topology, selected_frequency_vector, :, :, selected_reception_pencentage));
            values_selected_pushsum = squeeze(values_pushsum(selected_topology, selected_frequency_vector, :, :, selected_reception_pencentage));

            plot_values_gossip  = reshape(values_selected_gossip , [1 number_timers*number_simulations])';
            plot_values_pushsum = reshape(values_selected_pushsum, [1 number_timers*number_simulations])';

            n_probability = reception_probability_vector(selected_reception_pencentage)*ones(number_timers*number_simulations,1);
            subplot(number_frequencies,1,n_type_timer_frequencies);
            plot(n_probability, plot_values_gossip ,'.r'); hold on;
            plot(n_probability-0.005, plot_values_pushsum,'.b'); 
            plot([0 1.05], [real_average real_average], 'k'); 

        end
        
        ylim([20 80]);
        xlim([0 1.05]);
        
        if( selected_frequency_vector == 1 )
            title( 'a) Agent with same clock frequencies' );
        end
        if( selected_frequency_vector == 2 )
            title( 'b) Frequencies with same expected value and 10% of error' );
        end
        if( selected_frequency_vector == 3 )
            title( 'c) Agents with lower measurements have lower frequencies' );
        end
        if( selected_frequency_vector == 4 )
            title( 'd) Agents with lower measurements have higher frequencies' );
        end
        
        ylabel('Consensus');
        xlabel('Reception Probability');
        %legend('Broadcast-Gossip', 'Push-Sum', 'Real Average', 'Location','NorthEast');
        
    end
end

rmpath('Data')

