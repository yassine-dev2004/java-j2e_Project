package com.aether.model;

import jakarta.persistence.*;

@Entity
@Table(name = "agents")
public class Agent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AgentType type; // CITIZEN, VEHICLE, BUSINESS

    private String status; // IDLE, COMMUTING, WORKING, SHOPPING

    private double posX;
    private double posY;

    private double satisfaction; // 0.0 - 100.0

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "city_id")
    private City city;

    public enum AgentType {
        CITIZEN,
        VEHICLE,
        BUSINESS
    }

    public Agent() {}

    public Agent(String name, AgentType type, String status, double posX, double posY, City city) {
        this.name = name;
        this.type = type;
        this.status = status;
        this.posX = posX;
        this.posY = posY;
        this.satisfaction = 80.0;
        this.city = city;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public AgentType getType() { return type; }
    public void setType(AgentType type) { this.type = type; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public double getPosX() { return posX; }
    public void setPosX(double posX) { this.posX = posX; }

    public double getPosY() { return posY; }
    public void setPosY(double posY) { this.posY = posY; }

    public double getSatisfaction() { return satisfaction; }
    public void setSatisfaction(double satisfaction) { this.satisfaction = satisfaction; }

    public City getCity() { return city; }
    public void setCity(City city) { this.city = city; }
}
