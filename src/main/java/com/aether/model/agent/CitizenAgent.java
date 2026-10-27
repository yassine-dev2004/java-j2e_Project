package com.aether.model.agent;

import com.aether.engine.SimulationClock;
import com.aether.engine.SimulationContext;
import com.aether.model.Agent.AgentType;
import com.aether.model.city.CityNode;

import java.util.Map;

/**
 * Appendix B Conceptual UML - CitizenAgent.
 * Models autonomous citizens with daily routines: commuting, working, leisure, and spending.
 */
public class CitizenAgent extends AbstractAgent {

    public enum CitizenState {
        HOME_RESTING,
        COMMUTING_TO_WORK,
        WORKING,
        COMMUTING_TO_LEISURE,
        LEISURE,
        COMMUTING_HOME
    }

    private double income;
    private String occupation;
    private double wallet;
    private final String homeNodeId;
    private final String workNodeId;
    private String currentNodeId;
    private String leisureNodeId;
    private CitizenState state;
    private String employerId;
    private boolean employed;

    public CitizenAgent(String id, String name, double posX, double posY,
                        String homeNodeId, String workNodeId, String occupation,
                        double income) {
        super(id, name, AgentType.CITIZEN, posX, posY, "HOME_RESTING", 85.0);
        this.homeNodeId = homeNodeId;
        this.workNodeId = workNodeId;
        this.currentNodeId = homeNodeId;
        this.occupation = occupation;
        this.income = income;
        this.wallet = 250.0 + (income * 0.1);
        this.state = CitizenState.HOME_RESTING;
        this.employed = true;
    }

    public double getIncome() { return income; }
    public void setIncome(double income) { this.income = income; }
    public String getOccupation() { return occupation; }
    public void setOccupation(String occupation) { this.occupation = occupation; }
    public double getWallet() { return wallet; }
    public void setWallet(double wallet) { this.wallet = wallet; }
    public String getHomeNodeId() { return homeNodeId; }
    public String getWorkNodeId() { return workNodeId; }
    public String getCurrentNodeId() { return currentNodeId; }
    public void setCurrentNodeId(String currentNodeId) { this.currentNodeId = currentNodeId; }
    public CitizenState getCitizenState() { return state; }
    public boolean isEmployed() { return employed; }
    public void setEmployed(boolean employed) { this.employed = employed; }
    public String getEmployerId() { return employerId; }
    public void setEmployerId(String employerId) { this.employerId = employerId; }

    @Override
    public void step(SimulationContext context) {
        if (!active) return;

        SimulationClock clock = context.getClock();
        int hour = clock.getHour();

        switch (state) {
            case HOME_RESTING:
                if (hour >= 7 && hour < 9) {
                    commute(CitizenState.COMMUTING_TO_WORK, workNodeId, context);
                }
                break;

            case COMMUTING_TO_WORK:
                // Arrive at work
                this.currentNodeId = workNodeId;
                updatePositionToNode(context, workNodeId);
                this.state = CitizenState.WORKING;
                this.status = "WORKING (" + occupation + ")";
                break;

            case WORKING:
                work(context);
                if (hour >= 17) {
                    // Evening leisure or head home
                    if (Math.random() < 0.6) {
                        commute(CitizenState.COMMUTING_TO_LEISURE, "N-CENTRAL-PLAZA", context);
                    } else {
                        commute(CitizenState.COMMUTING_HOME, homeNodeId, context);
                    }
                }
                break;

            case COMMUTING_TO_LEISURE:
                this.currentNodeId = "N-CENTRAL-PLAZA";
                updatePositionToNode(context, "N-CENTRAL-PLAZA");
                this.state = CitizenState.LEISURE;
                this.status = "LEISURE & SHOPPING";
                break;

            case LEISURE:
                spend(context, 15.0 + Math.random() * 25.0);
                if (hour >= 21 || hour < 7) {
                    commute(CitizenState.COMMUTING_HOME, homeNodeId, context);
                }
                break;

            case COMMUTING_HOME:
                this.currentNodeId = homeNodeId;
                updatePositionToNode(context, homeNodeId);
                this.state = CitizenState.HOME_RESTING;
                this.status = "HOME_RESTING";
                // Slight recovery of happiness when resting comfortably
                setSatisfaction(this.satisfaction + 0.5);
                break;
        }

        // Apply environment congestion penalty to happiness
        double congestionFactor = context.getCongestionMultiplier();
        if (congestionFactor > 1.2 && (state == CitizenState.COMMUTING_TO_WORK || state == CitizenState.COMMUTING_HOME)) {
            setSatisfaction(this.satisfaction - 0.4);
        }
    }

    public void commute(CitizenState nextState, String destinationNodeId, SimulationContext context) {
        this.state = nextState;
        this.status = nextState.name();
    }

    public void work(SimulationContext context) {
        // Earn incremental income per hour
        double hourlyWage = income / 160.0;
        this.wallet += hourlyWage * 0.1;
    }

    public void spend(SimulationContext context, double amount) {
        if (this.wallet >= amount) {
            this.wallet -= amount;
            setSatisfaction(this.satisfaction + 0.3); // Shopping satisfaction
        }
    }

    private void updatePositionToNode(SimulationContext context, String targetNodeId) {
        CityNode node = context.getCityGraph().getNode(targetNodeId);
        if (node != null) {
            // Small jitter around node coordinate for visual separation
            this.posX = node.getX() + (Math.random() - 0.5) * 15.0;
            this.posY = node.getY() + (Math.random() - 0.5) * 15.0;
        }
    }

    @Override
    public Map<String, Object> getInspectionDetails() {
        Map<String, Object> details = super.getInspectionDetails();
        details.put("Occupation", occupation);
        details.put("Monthly Income", String.format("$%.0f", income));
        details.put("Wallet Balance", String.format("$%.2f", wallet));
        details.put("Home Station", homeNodeId);
        details.put("Work Station", workNodeId);
        details.put("Current Node", currentNodeId);
        details.put("State", state.name());
        details.put("Employment", employed ? "Employed" : "Seeking Job");
        return details;
    }
}
