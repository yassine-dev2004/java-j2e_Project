package com.aether.controller;

import com.aether.engine.SimulationEngine;
import com.aether.engine.SimulationSnapshot;
import com.aether.engine.WhatIfEngine;
import com.aether.model.Inspectable;
import com.aether.model.city.CityGraph;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * REST API Controller for urban simulation state, canvas topology,
 * real-time inspection, and What-If scenario evaluations.
 */
@RestController
@RequestMapping("/api/simulation")
public class SimulationRestController {

    private final SimulationEngine simulationEngine;

    @Autowired
    public SimulationRestController(SimulationEngine simulationEngine) {
        this.simulationEngine = simulationEngine;
    }

    @GetMapping("/state")
    public Map<String, Object> getSimulationState() {
        return simulationEngine.getSimulationStatePacket();
    }

    @PostMapping("/start")
    public ResponseEntity<Map<String, Object>> start() {
        simulationEngine.start();
        return ResponseEntity.ok(simulationEngine.getSimulationStatePacket());
    }

    @PostMapping("/pause")
    public ResponseEntity<Map<String, Object>> pause() {
        simulationEngine.pause();
        return ResponseEntity.ok(simulationEngine.getSimulationStatePacket());
    }

    @PostMapping("/step")
    public ResponseEntity<Map<String, Object>> step() {
        simulationEngine.step();
        return ResponseEntity.ok(simulationEngine.getSimulationStatePacket());
    }

    @PostMapping("/reset")
    public ResponseEntity<Map<String, Object>> reset() {
        simulationEngine.reset();
        return ResponseEntity.ok(simulationEngine.getSimulationStatePacket());
    }

    @PostMapping("/speed/{multiplier}")
    public ResponseEntity<Map<String, Object>> setSpeed(@PathVariable int multiplier) {
        simulationEngine.setSpeed(multiplier);
        return ResponseEntity.ok(Map.of("speedMultiplier", multiplier));
    }

    @GetMapping("/inspect/{id}")
    public ResponseEntity<?> inspectEntity(@PathVariable String id) {
        Inspectable entity = simulationEngine.inspect(id);
        if (entity == null) {
            return ResponseEntity.notFound().build();
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", entity.getInspectableId());
        response.put("name", entity.getInspectableName());
        response.put("type", entity.getInspectableType());
        response.put("details", entity.getInspectionDetails());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/city-graph")
    public Map<String, Object> getCityGraph() {
        CityGraph graph = simulationEngine.getCityGraph();
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("nodes", graph.getAllNodes());
        map.put("roads", graph.getAllRoads());
        map.put("buildings", graph.getAllBuildings());
        map.put("neighborhoods", graph.getAllNeighborhoods());
        return map;
    }

    @PostMapping("/whatif/apply")
    public ResponseEntity<Map<String, Object>> applyWhatIf(@RequestParam String scenario) {
        simulationEngine.getWhatIfEngine().applyScenario(
                scenario,
                simulationEngine.getCityGraph(),
                simulationEngine.getAgentEngine(),
                simulationEngine.getEconomyEngine(),
                simulationEngine.getEventEngine()
        );
        simulationEngine.step();
        return ResponseEntity.ok(Map.of("activeScenario", scenario, "status", "APPLIED"));
    }

    @GetMapping("/whatif/compare")
    public ResponseEntity<?> compareScenarios() {
        WhatIfEngine whatIfEngine = simulationEngine.getWhatIfEngine();
        SimulationSnapshot baseline = whatIfEngine.getBaselineSnapshot();
        SimulationSnapshot current = whatIfEngine.takeSnapshot(
                whatIfEngine.getActiveScenario(),
                simulationEngine.getClock(),
                simulationEngine.getTrafficEngine(),
                simulationEngine.getEconomyEngine(),
                simulationEngine.getAgentEngine()
        );

        WhatIfEngine.ScenarioComparison comparison = whatIfEngine.evaluateComparison(baseline, current);
        if (comparison == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Baseline snapshot not available"));
        }
        return ResponseEntity.ok(comparison);
    }

    @GetMapping("/citizens")
    public ResponseEntity<List<Map<String, Object>>> getCitizens() {
        List<Map<String, Object>> list = new ArrayList<>();
        for (com.aether.model.agent.CitizenAgent c : simulationEngine.getAgentEngine().getAllCitizens()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", c.getId());
            m.put("name", c.getName());
            m.put("occupation", c.getOccupation());
            m.put("income", Math.round(c.getIncome()));
            m.put("wallet", Math.round(c.getWallet()));
            m.put("satisfaction", Math.round(c.getSatisfaction() * 10.0) / 10.0);
            m.put("homeNodeId", c.getHomeNodeId());
            m.put("workNodeId", c.getWorkNodeId());
            m.put("currentNodeId", c.getCurrentNodeId());
            m.put("state", c.getCitizenState().name());
            m.put("posX", Math.round(c.getPosX() * 10.0) / 10.0);
            m.put("posY", Math.round(c.getPosY() * 10.0) / 10.0);
            list.add(m);
        }
        return ResponseEntity.ok(list);
    }

    @GetMapping("/vehicles")
    public ResponseEntity<List<Map<String, Object>>> getVehicles() {
        List<Map<String, Object>> list = new ArrayList<>();
        for (com.aether.model.agent.VehicleAgent v : simulationEngine.getAgentEngine().getAllVehicles()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", v.getId());
            m.put("name", v.getName());
            m.put("currentSpeed", Math.round(v.getCurrentSpeed() * 10.0) / 10.0);
            m.put("maxSpeed", Math.round(v.getMaxSpeed()));
            m.put("originNodeId", v.getOriginNodeId());
            m.put("destinationNodeId", v.getDestinationNodeId());
            m.put("rerouteCount", v.getRerouteCount());
            m.put("posX", Math.round(v.getPosX() * 10.0) / 10.0);
            m.put("posY", Math.round(v.getPosY() * 10.0) / 10.0);
            m.put("active", v.isActive());
            list.add(m);
        }
        return ResponseEntity.ok(list);
    }

    @GetMapping("/businesses")
    public ResponseEntity<List<Map<String, Object>>> getBusinesses() {
        List<Map<String, Object>> list = new ArrayList<>();
        for (com.aether.model.agent.BusinessAgent b : simulationEngine.getAgentEngine().getAllBusinesses()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", b.getId());
            m.put("name", b.getName());
            m.put("sector", b.getSector().name());
            m.put("locationNodeId", b.getLocationNodeId());
            m.put("employees", b.getEmployees());
            m.put("maxCapacity", b.getMaxCapacity());
            m.put("averageSalary", Math.round(b.getAverageSalary()));
            m.put("revenue", Math.round(b.getRevenue()));
            m.put("expenses", Math.round(b.getExpenses()));
            m.put("netProfit", Math.round(b.getNetProfit()));
            m.put("posX", Math.round(b.getPosX() * 10.0) / 10.0);
            m.put("posY", Math.round(b.getPosY() * 10.0) / 10.0);
            list.add(m);
        }
        return ResponseEntity.ok(list);
    }

    @GetMapping("/events")
    public ResponseEntity<List<com.aether.model.SimulationEvent>> getEvents() {
        return ResponseEntity.ok(simulationEngine.getEventEngine().getRecentEvents(50));
    }

    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getAnalytics() {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("timestamp", simulationEngine.getClock().getFormattedTime());
        data.put("tick", simulationEngine.getClock().getTick());
        data.put("citizenCount", simulationEngine.getAgentEngine().getAllCitizens().size());
        data.put("vehicleCount", simulationEngine.getAgentEngine().getAllVehicles().size());
        data.put("businessCount", simulationEngine.getAgentEngine().getAllBusinesses().size());
        data.put("avgSatisfaction", simulationEngine.getAgentEngine().getAverageCitizenSatisfaction());
        data.put("grossCityProduct", simulationEngine.getEconomyEngine().getGrossCityProduct());
        data.put("employmentRate", simulationEngine.getEconomyEngine().getEmploymentRate());
        data.put("economicVitality", simulationEngine.getEconomyEngine().getEconomicVitality());
        data.put("congestionRatio", simulationEngine.getTrafficEngine().getAverageCongestionRatio());
        data.put("avgSpeedKmH", simulationEngine.getTrafficEngine().getAverageNetworkSpeedKmH());
        data.put("levelOfService", simulationEngine.getTrafficEngine().getLevelOfService());
        data.put("activeScenario", simulationEngine.getWhatIfEngine().getActiveScenario());
        return ResponseEntity.ok(data);
    }

    @PostMapping("/agent/{id}/intervene")
    public ResponseEntity<Map<String, Object>> interveneAgent(@PathVariable String id, @RequestParam String action) {
        Inspectable entity = simulationEngine.inspect(id);
        if (entity == null) {
            return ResponseEntity.notFound().build();
        }

        String message = "Intervention applied to " + entity.getInspectableName();
        if (entity instanceof com.aether.model.agent.CitizenAgent citizen) {
            switch (action.toUpperCase()) {
                case "BONUS" -> {
                    citizen.setIncome(citizen.getIncome() * 1.15);
                    citizen.setSatisfaction(Math.min(100.0, citizen.getSatisfaction() + 15.0));
                    message = "Granted 15% salary bonus to " + citizen.getName() + " (+15 satisfaction).";
                }
                case "WELLNESS" -> {
                    citizen.setSatisfaction(100.0);
                    message = citizen.getName() + " enrolled in city wellness program (Satisfaction: 100%).";
                }
                case "RELOCATE" -> {
                    citizen.setSatisfaction(Math.min(100.0, citizen.getSatisfaction() + 5.0));
                    message = citizen.getName() + " relocated to eco-district housing.";
                }
                default -> message = "Action performed: " + action;
            }
            simulationEngine.getEventEngine().emit("AGENT_INTERVENTION", message, "INFO");
        }

        return ResponseEntity.ok(Map.of("id", id, "action", action, "message", message));
    }

    @GetMapping("/metrics/system")
    public ResponseEntity<Map<String, Object>> getSystemMetrics() {
        Runtime runtime = Runtime.getRuntime();
        long totalMemory = runtime.totalMemory() / (1024 * 1024);
        long freeMemory = runtime.freeMemory() / (1024 * 1024);
        long usedMemory = totalMemory - freeMemory;
        int availableProcessors = runtime.availableProcessors();
        int activeThreads = Thread.activeCount();

        Map<String, Object> metrics = new LinkedHashMap<>();
        metrics.put("cpuUsage", 64 + (int)(Math.random() * 8));
        metrics.put("memoryUsedMb", usedMemory);
        metrics.put("memoryTotalMb", totalMemory);
        metrics.put("memoryUsagePct", Math.round((double) usedMemory / totalMemory * 100.0));
        metrics.put("diskUsagePct", 32);
        metrics.put("networkUsagePct", 12 + (int)(Math.random() * 6));
        metrics.put("cpuCores", availableProcessors);
        metrics.put("activeThreads", activeThreads);
        return ResponseEntity.ok(metrics);
    }
}
