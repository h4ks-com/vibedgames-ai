import numpy as np

class QuantumCircuit:
    def __init__(self, num_qubits):
        self.num_qubits = num_qubits
        self.state_vector = np.zeros(2 ** num_qubits, dtype=complex)
        self.state_vector[0] = 1.0

    def apply_gate(self, gate, target_qubits):
        full_gate = self.expand_single_qubit_gate(gate, target_qubits)
        self.state_vector = full_gate @ self.state_vector

    def expand_single_qubit_gate(self, gate, target_qubits):
        # Initialize with identity
        full_gate = 1
        for qubit in range(self.num_qubits):
            if qubit in target_qubits:
                full_gate = np.kron(full_gate, gate)
            else:
                full_gate = np.kron(full_gate, np.eye(2))
        return full_gate

    def measure(self):
        probabilities = np.abs(self.state_vector) ** 2
        outcome = np.random.choice(len(probabilities), p=probabilities)
        return format(outcome, f'0{self.num_qubits}b')

# Define single qubit gates
X = np.array([[0,1],[1,0]])
H = (1/np.sqrt(2)) * np.array([[1,1],[1,-1]])

# Example usage
quantum_circuit = QuantumCircuit(2)
quantum_circuit.apply_gate(H, [0])
quantum_circuit.apply_gate(X, [1])
measurement_result = quantum_circuit.measure()
print("Measurement outcome:", measurement_result)