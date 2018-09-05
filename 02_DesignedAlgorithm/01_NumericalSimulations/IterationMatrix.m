
function Mr = IterationMatrix(topology,N,success,i,k)

    N2 = N^2;
    
    if (success == 1)
        
        %% Creating A matrix:
        A = eye(N,N);
        A(k,k) = 0.5;
        A(k,i) = 0.5;
        A(i,i) = 0.5;
        A(i,k) = 0.5;

        %% Creating B matrix:
        B = zeros(N,N2);
        B(k,N*(k-1)+i) = 0.5;
        B(k,N*(i-1)+k) = 0.5;
        B(i,N*(i-1)+k) = 0.5;
        B(i,N*(k-1)+i) = 0.5;

        %% Creating C matrix:
        C = zeros(N2,N);

        %% Creating D matrix:
        D = eye(N2,N2);
        D(N*(k-1)+i,N*(k-1)+i) = 0;
        D(N*(i-1)+k,N*(i-1)+k) = 0;
        
    else
        
        %% Creating A matrix:
        A = eye(N,N);
        A(k,k) = 0.5;
        A(k,i) = 0.5;

        %% Creating B matrix:
        B = zeros(N,N2);
        if k > i
            B(k,N*(k-1)+i) = 0.5;
        else
            B(k,N*(i-1)+k) = 0.5;
        end

        %% Creating C matrix:
        C = zeros(N2,N);
        if k > i
            C(N*(k-1)+i,k) =  0.5;
            C(N*(k-1)+i,i) = -0.5;
        else
            C(N*(i-1)+k,k) =  0.5;
            C(N*(i-1)+k,i) = -0.5;
        end

        %% Creating D matrix:
        D = eye(N2,N2);
        if k > i
            D(N*(k-1)+i,N*(k-1)+i) = 0.5;
        else
            D(N*(i-1)+k,N*(i-1)+k) = 0.5;
        end
        
    end
    
    %% Resize according topology:
    vector_boolean = reshape(topology,[1 N2]);
    N2r = sum(vector_boolean,2);
    vector_r = zeros(1,N2r);
    counter = 1;
    for n = 1:N2
        if (vector_boolean(n) == 1)
            vector_r(counter) = n;
            counter = counter + 1;
        end
    end

    %% Deleting zero diagonal and the erros according topology:
    Ar = A;
    Br = B(:,vector_r);
    Cr = C(vector_r,:);
    Dr = D(vector_r,vector_r);

    %% Computing M and Mr Matrix:
    M  = [A B; C D];
    Mr = [Ar Br; Cr Dr];
        
end