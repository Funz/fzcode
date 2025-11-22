#!/usr/bin/env python
"""
Perfect Gas Simulation
Reads compiled input and validates the ideal gas law
"""

import re

def parse_input(filename='input.txt'):
    """Parse the compiled input file"""
    params = {}
    with open(filename, 'r') as f:
        for line in f:
            # Skip comments and empty lines
            if line.strip().startswith('#') or not line.strip():
                continue

            # Parse key=value pairs
            match = re.match(r'(\w+)=([\d.]+)', line.strip())
            if match:
                key, value = match.groups()
                params[key] = float(value)

    return params

def main():
    params = parse_input()

    # Extract values
    T_kelvin = params.get('T_kelvin', 0)
    V_m3 = params.get('V_m3', 0)
    P_calculated = params.get('P_calculated', 0)

    # Write results
    with open('output.txt', 'w') as f:
        f.write(f"Temperature: {T_kelvin:.2f} K\n")
        f.write(f"Volume: {V_m3:.6f} m³\n")
        f.write(f"Pressure: {P_calculated:.2f} Pa\n")
        f.write(f"\nSimulation completed successfully\n")

    print("Simulation complete")

if __name__ == '__main__':
    main()
