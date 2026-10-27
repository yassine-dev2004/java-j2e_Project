package com.aether.service;

import com.aether.model.Agent;
import java.util.List;
import java.util.Optional;

public interface AgentService {
    List<Agent> getAllAgents();
    List<Agent> getAgentsByCity(Long cityId);
    List<Agent> getAgentsByType(Agent.AgentType type);
    Optional<Agent> getAgentById(Long id);
    Agent createAgent(Agent agent);
    Agent updateAgent(Long id, Agent agent);
    void deleteAgent(Long id);
    void stepSimulation();
}
