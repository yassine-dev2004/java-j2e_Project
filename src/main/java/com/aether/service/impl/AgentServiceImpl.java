package com.aether.service.impl;

import com.aether.model.Agent;
import com.aether.repository.AgentRepository;
import com.aether.service.AgentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
public class AgentServiceImpl implements AgentService {

    private final AgentRepository agentRepository;
    private final Random random = new Random();

    @Autowired
    public AgentServiceImpl(AgentRepository agentRepository) {
        this.agentRepository = agentRepository;
    }

    @Override
    public List<Agent> getAllAgents() {
        return agentRepository.findAll();
    }

    @Override
    public List<Agent> getAgentsByCity(Long cityId) {
        return agentRepository.findByCityId(cityId);
    }

    @Override
    public List<Agent> getAgentsByType(Agent.AgentType type) {
        return agentRepository.findByType(type);
    }

    @Override
    public Optional<Agent> getAgentById(Long id) {
        return agentRepository.findById(id);
    }

    @Override
    public Agent createAgent(Agent agent) {
        return agentRepository.save(agent);
    }

    @Override
    public Agent updateAgent(Long id, Agent agentDetails) {
        Agent existing = agentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Agent with id " + id + " not found"));
        existing.setName(agentDetails.getName());
        existing.setType(agentDetails.getType());
        existing.setStatus(agentDetails.getStatus());
        existing.setPosX(agentDetails.getPosX());
        existing.setPosY(agentDetails.getPosY());
        existing.setSatisfaction(agentDetails.getSatisfaction());
        if (agentDetails.getCity() != null) {
            existing.setCity(agentDetails.getCity());
        }
        return agentRepository.save(existing);
    }

    @Override
    public void deleteAgent(Long id) {
        agentRepository.deleteById(id);
    }

    @Override
    public void stepSimulation() {
        List<Agent> agents = agentRepository.findAll();
        for (Agent agent : agents) {
            // Autonomous agent movement update simulation
            double deltaX = (random.nextDouble() - 0.5) * 2.0;
            double deltaY = (random.nextDouble() - 0.5) * 2.0;
            agent.setPosX(agent.getPosX() + deltaX);
            agent.setPosY(agent.getPosY() + deltaY);
            
            // Fluctuating satisfaction based on simulated environment
            double satDelta = (random.nextDouble() - 0.48) * 1.5;
            double newSat = Math.max(0.0, Math.min(100.0, agent.getSatisfaction() + satDelta));
            agent.setSatisfaction(Math.round(newSat * 10.0) / 10.0);
        }
        agentRepository.saveAll(agents);
    }
}
