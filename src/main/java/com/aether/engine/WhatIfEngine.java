package com.aether.engine;

import com.aether.model.agent.BusinessAgent;
import com.aether.model.agent.CitizenAgent;
import com.aether.model.agent.VehicleAgent;
import com.aether.model.city.CityGraph;
import com.aether.model.city.RoadSegment;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;

/**
 * MOD-07 WhatIfEngine.
 * Handles scenario branching, state snapshotting, environmental disruptions,
 * and comparative analytics against baseline city performance (FR9, FR10).
 */
@Component
public class WhatIfEngine {

    public record MetricDiff(String metricName, String baselineValue, String scenarioValue, String delta, boolean isPositive) {}

    public record ScenarioComparison(
            String scenarioKey,
            String scenarioTitle,
            String description,
            LocalDateTime executedAt,
            List<MetricDiff> metrics,
            String aiRecommendation
    ) {}

    private volatile SimulationSnapshot baselineSnapshot = null;
    private volatile SimulationSnapshot activeScenarioSnapshot = null;
    private volatile String activeScenario = "BASELINE";

    public SimulationSnapshot takeSnapshot(String scenarioName, SimulationClock clock,
                                           TrafficEngine trafficEngine, EconomyEngine economyEngine,
                                           AgentEngine agentEngine) {
        int reroutes = agentEngine.getAllVehicles().stream().mapToInt(VehicleAgent::getRerouteCount).sum();

        return new SimulationSnapshot(
                scenarioName,
                LocalDateTime.now(),
                clock.getTick(),
                trafficEngine.getAverageCongestionRatio(),
                trafficEngine.getAverageNetworkSpeedKmH(),
                trafficEngine.getLevelOfService(),
                agentEngine.getAverageCitizenSatisfaction(),
                economyEngine.getEmploymentRate(),
                economyEngine.getGrossCityProduct(),
                agentEngine.getAllVehicles().size(),
                agentEngine.getAllCitizens().size(),
                agentEngine.getAllBusinesses().size(),
                reroutes,
                Map.of()
        );
    }

    public void setBaselineSnapshot(SimulationSnapshot snapshot) {
        this.baselineSnapshot = snapshot;
    }

    public SimulationSnapshot getBaselineSnapshot() {
        return baselineSnapshot;
    }

    public String getActiveScenario() {
        return activeScenario;
    }

    /**
     * Applies a designated What-If scenario modification to the live city.
     */
    public void applyScenario(String scenarioKey, CityGraph graph, AgentEngine agentEngine,
                              EconomyEngine economyEngine, EventEngine eventEngine) {
        String key = (scenarioKey != null) ? scenarioKey.toUpperCase() : "BASELINE";
        this.activeScenario = key;

        switch (key) {
            case "ROAD_CLOSURE", "BRANCH_1" -> {
                // Close major arterial Avenue des Nations
                RoadSegment fwd = graph.getRoad("RD-DOWNTOWN-CENTRAL-FWD");
                RoadSegment rev = graph.getRoad("RD-DOWNTOWN-CENTRAL-REV");
                if (fwd != null) fwd.setClosed(true);
                if (rev != null) rev.setClosed(true);

                eventEngine.emit("WHAT_IF_ROAD_CLOSURE",
                        "SCENARIO ACTIVATED: Major downtown artery 'Avenue des Nations' closed for structural work. Vehicles will reroute via A*.",
                        "CRITICAL");
            }
            case "ECONOMIC_STIMULUS", "BRANCH_2" -> {
                // Inject $25,000 subsidy into all business agents
                for (BusinessAgent biz : agentEngine.getAllBusinesses()) {
                    biz.injectStimulus(25000.0);
                }
                economyEngine.setEconomicVitality(1.35);

                eventEngine.emit("WHAT_IF_ECONOMIC_STIMULUS",
                        "SCENARIO ACTIVATED: Municipal Tech & Innovation Grant deployed. Capital injected into local enterprises.",
                        "INFO");
            }
            case "TRANSIT_EXPANSION" -> {
                // Rapid transit line open: 30% of vehicles deactivated as riders convert to light rail
                int converted = 0;
                for (VehicleAgent v : agentEngine.getAllVehicles()) {
                    if (converted < 30) {
                        v.setActive(false);
                        v.cleanup();
                        converted++;
                    }
                }
                eventEngine.emit("WHAT_IF_TRANSIT_EXPANSION",
                        "SCENARIO ACTIVATED: Rapid Bus & Light Rail corridor operational. 30 private vehicles shifted to public transit.",
                        "INFO");
            }
            case "ENERGY_CRISIS" -> {
                economyEngine.setEconomicVitality(0.70);
                for (CitizenAgent c : agentEngine.getAllCitizens()) {
                    c.setSatisfaction(c.getSatisfaction() - 10.0);
                }
                eventEngine.emit("WHAT_IF_ENERGY_CRISIS",
                        "SCENARIO ACTIVATED: Grid brownouts and energy tariffs reduce industrial output by 30%.",
                        "WARNING");
            }
            default -> {
                resetToBaseline(graph, agentEngine, economyEngine, eventEngine);
            }
        }
    }

    public void resetToBaseline(CityGraph graph, AgentEngine agentEngine,
                                EconomyEngine economyEngine, EventEngine eventEngine) {
        this.activeScenario = "BASELINE";
        for (RoadSegment road : graph.getAllRoads()) {
            road.setClosed(false);
        }
        for (VehicleAgent v : agentEngine.getAllVehicles()) {
            v.setActive(true);
        }
        economyEngine.setEconomicVitality(1.0);
        eventEngine.emit("SCENARIO_RESET", "Simulation returned to baseline default parameters.", "INFO");
    }

    public ScenarioComparison evaluateComparison(SimulationSnapshot baseline, SimulationSnapshot current) {
        if (baseline == null || current == null) {
            return null;
        }

        List<MetricDiff> diffs = new ArrayList<>();

        // Traffic Congestion
        double baseCong = baseline.averageCongestionRatio() * 100.0;
        double currCong = current.averageCongestionRatio() * 100.0;
        double congDelta = currCong - baseCong;
        diffs.add(new MetricDiff(
                "Road Congestion",
                String.format("%.1f%%", baseCong),
                String.format("%.1f%%", currCong),
                String.format("%+.1f%%", congDelta),
                congDelta <= 0 // Lower congestion is better
        ));

        // Network Speed
        double baseSpeed = baseline.averageSpeedKmH();
        double currSpeed = current.averageSpeedKmH();
        double speedDelta = currSpeed - baseSpeed;
        diffs.add(new MetricDiff(
                "Average Vehicle Speed",
                String.format("%.1f km/h", baseSpeed),
                String.format("%.1f km/h", currSpeed),
                String.format("%+.1f km/h", speedDelta),
                speedDelta >= 0
        ));

        // Citizen Satisfaction
        double baseSat = baseline.averageSatisfaction();
        double currSat = current.averageSatisfaction();
        double satDelta = currSat - baseSat;
        diffs.add(new MetricDiff(
                "Citizen Satisfaction",
                String.format("%.1f%%", baseSat),
                String.format("%.1f%%", currSat),
                String.format("%+.1f%%", satDelta),
                satDelta >= 0
        ));

        // Employment Rate
        double baseEmp = baseline.employmentRate();
        double currEmp = current.employmentRate();
        double empDelta = currEmp - baseEmp;
        diffs.add(new MetricDiff(
                "Employment Rate",
                String.format("%.1f%%", baseEmp),
                String.format("%.1f%%", currEmp),
                String.format("%+.1f%%", empDelta),
                empDelta >= 0
        ));

        // Gross City Product
        double baseGcp = baseline.grossCityProduct();
        double currGcp = current.grossCityProduct();
        double gcpDeltaPct = (currGcp - baseGcp) / Math.max(1.0, baseGcp) * 100.0;
        diffs.add(new MetricDiff(
                "Economic Output (GDP)",
                String.format("$%.0f", baseGcp),
                String.format("$%.0f", currGcp),
                String.format("%+.1f%%", gcpDeltaPct),
                gcpDeltaPct >= 0
        ));

        // Reroutes
        int baseReroutes = baseline.totalReroutes();
        int currReroutes = current.totalReroutes();
        int rerouteDelta = currReroutes - baseReroutes;
        diffs.add(new MetricDiff(
                "Active Reroutes",
                String.valueOf(baseReroutes),
                String.valueOf(currReroutes),
                String.format("%+d", rerouteDelta),
                rerouteDelta <= 0
        ));

        // AI Recommendation synthesis
        String aiRec = switch (current.scenarioName()) {
            case "ROAD_CLOSURE" ->
                    "Predictive Analysis: Closing Avenue des Nations generated a " + String.format("%.1f%%", congDelta) +
                    " congestion delta on parallel corridors (West Boulevard & Tech Freeway). Recommendation: Signal timing adjustments on N-CENTRAL-PLAZA required.";
            case "ECONOMIC_STIMULUS" ->
                    "Predictive Analysis: Stimulus boosted business expansion and increased average citizen satisfaction by " +
                    String.format("%.1f%%", satDelta) + ". Recommendation: High economic multiplier observed in Tech & Commercial sectors.";
            case "TRANSIT_EXPANSION" ->
                    "Predictive Analysis: Modal shift from private vehicles to public transit reduced overall network bottlenecks, improving average network speed by " +
                    String.format("%.1f km/h", speedDelta) + ". Highly recommended permanent urban policy.";
            default -> "Simulation baseline state evaluated across multi-agent behavioral parameters.";
        };

        return new ScenarioComparison(
                current.scenarioName(),
                getScenarioTitle(current.scenarioName()),
                "Side-by-side What-If scenario assessment against baseline state.",
                LocalDateTime.now(),
                diffs,
                aiRec
        );
    }

    private String getScenarioTitle(String key) {
        return switch (key) {
            case "ROAD_CLOSURE" -> "Avenue des Nations Closure (Rerouting)";
            case "ECONOMIC_STIMULUS" -> "Municipal Innovation Grant ($25k/biz)";
            case "TRANSIT_EXPANSION" -> "Public Light Rail Expansion";
            case "ENERGY_CRISIS" -> "Power Grid Brownout (-30% Output)";
            default -> "Baseline City Configuration";
        };
    }
}
