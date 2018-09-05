
%Reset all:
close all;
clear; clc;

%Include data:
addpath 'Data_Hardware_Consensus_TopologyAll';

%Data matrices:
Data_protocol_1 = zeros(20,6,3);
Data_protocol_2 = zeros(20,6,3);

%Read Data:
str1 = 'DATA_protocol_';
str2 = '_simulation_';
str3 = '_agent_';
str4 = '.txt';
for n_prototcol = 1:2
    str12 = num2str(n_prototcol);
    for n_simulation = 1:20
        str23 = num2str(n_simulation);
        if(n_simulation < 10)
            str23 = strcat('0',str23);
        end
        for n_agent = 1:6
            str34 = num2str(n_agent + 99);
            
            %Open file:
            file_name = strcat(str1, str12, str2, str23, str3, str34, str4);
            file_ID   = fopen(file_name,'r');
            if(file_ID == -1)
                disp('File open ERORR')
            end 
            
            %Read until the end of the file 
            count = 0;
            while(~feof(file_ID))
                %Read each line:
                line = fgetl(file_ID);
                if(strcmp(line,''))
                   count = count + 1;
                end
                %Read only last number data:
                if((count == 4) && (strcmp(line,'') == 1))
                    
                    %Separate data states:
                    k = strfind(line_last,';');
                    state   = str2double(line_last(     1:k(1)-1));
                    state_1 = str2double(line_last(k(1)+1:k(2)-1));
                    state_2 = str2double(line_last(k(2)+1:end));
                    
                    %Save data into matrices:
                    if(n_prototcol == 1)
                        Data_protocol_1(n_simulation,n_agent,1) = state;
                        Data_protocol_1(n_simulation,n_agent,2) = state_1;
                        Data_protocol_1(n_simulation,n_agent,3) = state_2;
                    end
                    if(n_prototcol == 2)
                        Data_protocol_2(n_simulation,n_agent,1) = state;
                        Data_protocol_2(n_simulation,n_agent,2) = state_1;
                        Data_protocol_2(n_simulation,n_agent,3) = state_2;
                    end
                end
                line_last = line;
            end
            
            %Check if there is 4 spaces (this mean that the file is correct) 
            if(count ~= 4)
                disp('Error: Incorrect file format')
            end
            fclose(file_ID);
            
        end
    end
end

%Get final states:
states_p1 = squeeze(Data_protocol_1(:,:,1))';
states_p2 = squeeze(Data_protocol_2(:,:,1))';

%Reshape data to plot:
n_aux = 1:(length(states_p1(1,:)));
n_aux = ones(length(states_p1(:,1)),1)*n_aux;
n     = reshape(n_aux,[1 (length(states_p1(1,:)))*length(states_p1(:,1))]);
x_all          = 23*ones(1,(length(states_p1(1,:)))*length(states_p1(:,1)));
plot_states_p1 = reshape(states_p1,[1 (length(states_p1(1,:)))*length(states_p1(:,1))]);
plot_states_p2 = reshape(states_p2,[1 (length(states_p1(1,:)))*length(states_p1(:,1))]);

%Statistics:
state_avg = 50;
state_mean_p1 = mean(abs(plot_states_p1-state_avg));
state_mean_p2 = mean(abs(plot_states_p2-state_avg));
state_std_p1 = sqrt(mean((plot_states_p1-state_avg).^2));
state_std_p2 = sqrt(mean((plot_states_p2-state_avg).^2));


%Plot data:
figure;
plot(x_all,plot_states_p1,'.r'); hold on;
plot(x_all+0.2,plot_states_p2,'.b');
plot([0 25], [50 50], 'k');
plot([21 21], [0 100], '--k');
plot(n,plot_states_p1,'.r'); 
plot(n+0.1,plot_states_p2,'.b');
xlim([0 24.9])
ylim([35 65])
title({'Hardware Implementation: 5-Neighbors Topology',strcat('broadcast gossip:       MAE =  ', num2str(round(state_mean_p1*100)/100), '       RMSE =  ', num2str(round(state_std_p1*100)/100)), ...
                                               strcat('push-sum:                   MAE =  ', num2str(round(state_mean_p2*100)/100), '       RMSE =  ', num2str(round(state_std_p2*100)/100))});
ylabel('Consensus');
xlabel('Execution');
legend('broadcast gossip', 'push-sum', 'real average', 'Location','NorthWest');














