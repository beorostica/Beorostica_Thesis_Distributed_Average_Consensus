
%Reset all:
clear all;
close all;
clear, clc;

%Parameters:
topology = [ 0 1 0 1;
             0 0 1 0;
             0 0 0 1;
             0 0 0 0];   %it gotta be triangular superior with zero diagonal
top_bidir = topology + topology';   %Auxiliary: adjacency matrix.
N = size(topology,1);  %number agents
E = sum(sum(topology));%number gossips communication

%Initial Condition:
%rng(8);
MatrixLCP = eye(N+E,N+E);
MatrixRCP = eye(N+E,N+E);

%Repeating:
for n = 1:1000
    
    %Setting random communication between two agents:
    success = 0;
    i = randi(N);
    K = sum(top_bidir(:,i));
    index_k = randi(K);
    possibles_k = find(top_bidir(i,:));
    k = possibles_k(index_k);

    %Update matrix product:
    Mr = IterationMatrix(topology,N,success,i,k);
    MatrixLCP = Mr*MatrixLCP;
    MatrixRCP = Mr*MatrixLCP*Mr;

end 

MatrixLCP
