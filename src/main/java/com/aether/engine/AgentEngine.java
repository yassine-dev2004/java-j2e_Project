package com.aether.engine;

import com.aether.model.Inspectable;
import com.aether.model.agent.AbstractAgent;
import com.aether.model.agent.BusinessAgent;
import com.aether.model.agent.BusinessAgent.BusinessSector;
import com.aether.model.agent.CitizenAgent;
import com.aether.model.agent.VehicleAgent;
import com.aether.model.city.CityGraph;
import com.aether.model.city.CityNode;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * MOD-02 AgentEngine.
 * Creates, populates, and concurrently updates autonomous citizens, vehicles, and businesses.
 * Complies with Appendix B Conceptual UML and NFR-02 / NFR-05.
 */
@Component
public class AgentEngine {

    private final Map<String, CitizenAgent> citizens = new ConcurrentHashMap<>();
    private final Map<String, VehicleAgent> vehicles = new ConcurrentHashMap<>();
    private final Map<String, BusinessAgent> businesses = new ConcurrentHashMap<>();

    private static final String[] CITIZEN_NAMES = {
            "Alexandre Martin", "Sophie Dubois", "Lucas Bernard", "Emma Thomas",
            "Yassine Mezghani", "Louay Hamdi", "Camille Robert", "Hugo Richard",
            "Lea Petit", "Antoine Durand", "Chloe Leroy", "Julien Moreau",
            "Sarah Simon", "Gabriel Laurent", "Ines Lefebvre", "Nicolas Michel"
    };

    private static final String[] OCCUPATIONS = {
            "Senior AI Engineer", "Data Scientist", "Architect", "Civil Engineer",
            "Doctor", "High School Teacher", "Financial Analyst", "Retail Manager",
            "Logistics Coordinator", "Urban Planner", "Software Developer", "Biochemist"
    };

    private static final String[] BUSINESS_NAMES = {
            "Apex Neural Technologies", "CyberFlow Analytics", "Metropolis Commercial Bank",
            "OmniMart Supercenter", "Bayside Logistics & Freight", "Quantum BioLabs",
            "Atlas Structural Engineering", "CloudScale Networks", "Horizon Clean Energy",
            "Precision Robotics Ltd", "Nexus Financial Advisory", "AeroVanguard Systems"
    };

    public void populateAgents(CityGraph graph) {
        clear();

        List<CityNode> nodes = new ArrayList<>(graph.getAllNodes());
        if (nodes.isEmpty()) return;

        Random random = new Random(42); // Reproducible initial seed (NFR-04)

        // 1. Create Business Agents (~50 businesses across the city)
        for (int i = 0; i < 50; i++) {
            String id = "BIZ-" + String.format("%03d", i + 1);
            String name = (i < BUSINESS_NAMES.length) ? BUSINESS_NAMES[i] : "Enterprise " + (i + 1);
            CityNode hubNode = nodes.get(random.nextInt(nodes.size()));

            BusinessSector sector = BusinessSector.values()[random.nextInt(BusinessSector.values().length)];
            int initialStaff = 8 + random.nextInt(25);
            int capacity = initialStaff + 15 + random.nextInt(20);
            double avgSalary = 2800.0 + random.nextInt(3500);

            BusinessAgent biz = new BusinessAgent(
                    id, name, sector, hubNode.getId(),
                    hubNode.getX() + (random.nextDouble() - 0.5) * 30.0,
                    hubNode.getY() + (random.nextDouble() - 0.5) * 30.0,
                    initialStaff, capacity, avgSalary
            );
            businesses.put(id, biz);
        }

        // 2. Create Citizen Agents (~500 citizens)
        List<String> residentialNodeIds = List.of("N-UPTOWN-1", "N-UPTOWN-2", "N-BAYSIDE-1", "N-METRO-SOUTH");
        List<String> commercialNodeIds = List.of("N-CENTRAL-PLAZA", "N-TECH-HUB", "N-FINANCIAL", "N-CIVIC-HALL", "N-IND-PARK");

        for (int i = 0; i < 500; i++) {
            String id = "CITIZEN-" + String.format("%04d", i + 1);
            String name = (i < CITIZEN_NAMES.length) ? CITIZEN_NAMES[i] : ("Citizen " + (i + 1));
            String homeNodeId = residentialNodeIds.get(random.nextInt(residentialNodeIds.size()));
            String workNodeId = commercialNodeIds.get(random.nextInt(commercialNodeIds.size()));
            String occupation = OCCUPATIONS[random.nextInt(OCCUPATIONS.length)];
            double income = 2200.0 + random.nextInt(4500);

            CityNode homeNode = graph.getNode(homeNodeId);
            double x = (homeNode != null) ? homeNode.getX() : 200;
            double y = (homeNode != null) ? homeNode.getY() : 200;

            CitizenAgent citizen = new CitizenAgent(
                    id, name, x, y, homeNodeId, workNodeId, occupation, income
            );
            citizens.put(id, citizen);
        }

        // 3. Create Vehicle Agents (~150 autonomous vehicles)
        for (int i = 0; i < 150; i++) {
            String id = "VEHICLE-" + String.format("%03d", i + 1);
            String name = "Vehicle #" + (i + 1);
            CityNode orig = nodes.get(random.nextInt(nodes.size()));
            CityNode dest = nodes.get(random.nextInt(nodes.size()));
            while (dest.getId().equals(orig.getId())) {
                dest = nodes.get(random.nextInt(nodes.size()));
            }

            double maxSpeed = 45.0 + random.nextInt(35); // 45 to 80 km/h
            VehicleAgent vehicle = new VehicleAgent(id, name, maxSpeed, orig.getId(), dest.getId());
            vehicle.setPosX(orig.getX());
            vehicle.setPosY(orig.getY());
            vehicles.put(id, vehicle);
        }
    }

    /**
     * Executes one simulation cycle across all agents concurrently.
     * Guarantees fault isolation (NFR-05): an exception in one agent does not disrupt the loop.
     */
    public void stepAllAgents(SimulationContext context) {
        // Step Businesses
        businesses.values().forEach(biz -> {
            try {
                biz.step(context);
            } catch (Exception ignored) {
            }
        });

        // Step Citizens
        citizens.values().forEach(citizen -> {
            try {
                citizen.step(context);
            } catch (Exception ignored) {
            }
        });

        // Step Vehicles concurrently
        vehicles.values().parallelStream().forEach(vehicle -> {
            try {
                vehicle.step(context);
            } catch (Exception ignored) {
            }
        });
    }

    public Inspectable findInspectable(String id, CityGraph graph) {
        if (id == null || id.isBlank()) return null;
        if (citizens.containsKey(id)) return citizens.get(id);
        if (vehicles.containsKey(id)) return vehicles.get(id);
        if (businesses.containsKey(id)) return businesses.get(id);
        if (graph.getNode(id) != null) return graph.getNode(id);
        if (graph.getRoad(id) != null) return graph.getRoad(id);
        if (graph.getBuilding(id) != null) return graph.getBuilding(id);
        if (graph.getNeighborhood(id) != null) return graph.getNeighborhood(id);

        // Normalize variations (e.g. CITIZEN_317 -> CITIZEN-0317 or BIZ_23 -> BIZ-023)
        String norm = id.toUpperCase().replace('_', '-');
        if (citizens.containsKey(norm)) return citizens.get(norm);
        if (businesses.containsKey(norm)) return businesses.get(norm);

        if (norm.startsWith("CITIZEN-")) {
            String numPart = norm.substring("CITIZEN-".length());
            try {
                int n = Integer.parseInt(numPart);
                String padded = String.format("CITIZEN-%04d", n);
                if (citizens.containsKey(padded)) return citizens.get(padded);
            } catch (NumberFormatException ignored) {}
        }
        if (norm.startsWith("BIZ-")) {
            String numPart = norm.substring("BIZ-".length());
            try {
                int n = Integer.parseInt(numPart);
                String padded = String.format("BIZ-%03d", n);
                if (businesses.containsKey(padded)) return businesses.get(padded);
            } catch (NumberFormatException ignored) {}
        }

        return null;
    }

    public Collection<CitizenAgent> getAllCitizens() {
        return Collections.unmodifiableCollection(citizens.values());
    }

    public Collection<VehicleAgent> getAllVehicles() {
        return Collections.unmodifiableCollection(vehicles.values());
    }

    public Collection<BusinessAgent> getAllBusinesses() {
        return Collections.unmodifiableCollection(businesses.values());
    }

    public double getAverageCitizenSatisfaction() {
        if (citizens.isEmpty()) return 80.0;
        return citizens.values().stream().mapToDouble(CitizenAgent::getSatisfaction).average().orElse(80.0);
    }

    public void clear() {
        vehicles.values().forEach(VehicleAgent::cleanup);
        citizens.clear();
        vehicles.clear();
        businesses.clear();
    }
}
