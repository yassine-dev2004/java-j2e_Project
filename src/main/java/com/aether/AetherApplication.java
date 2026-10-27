package com.aether;

import com.aether.model.City;
import com.aether.repository.CityRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication(excludeName = {
    "org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration",
    "org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration"
})
public class AetherApplication {

    public static void main(String[] args) {
        SpringApplication.run(AetherApplication.class, args);
    }

    @Bean
    public CommandLineRunner initData(CityRepository cityRepository, com.aether.repository.AgentRepository agentRepository) {
        return args -> {
            if (cityRepository.count() == 0) {
                City neoMetropolis = cityRepository.save(new City("Neo-Metropolis", 12500, 4800, 950));
                cityRepository.save(new City("Cyberia Prime", 8200, 3100, 620));
                cityRepository.save(new City("Aetheria Bay", 15400, 5600, 1100));

                if (agentRepository.count() == 0) {
                    agentRepository.save(new com.aether.model.Agent("Citizen #317", com.aether.model.Agent.AgentType.CITIZEN, "WORKING", 485.0, 395.0, neoMetropolis));
                    agentRepository.save(new com.aether.model.Agent("Citizen #402", com.aether.model.Agent.AgentType.CITIZEN, "COMMUTING", 350.0, 220.0, neoMetropolis));
                    agentRepository.save(new com.aether.model.Agent("Citizen #128", com.aether.model.Agent.AgentType.CITIZEN, "RECREATION", 435.0, 160.0, neoMetropolis));
                    agentRepository.save(new com.aether.model.Agent("Citizen #509", com.aether.model.Agent.AgentType.CITIZEN, "MEETING", 630.0, 240.0, neoMetropolis));
                    agentRepository.save(new com.aether.model.Agent("Vehicle #001", com.aether.model.Agent.AgentType.VEHICLE, "TRANSIT", 380.0, 340.0, neoMetropolis));
                    agentRepository.save(new com.aether.model.Agent("Business #023", com.aether.model.Agent.AgentType.BUSINESS, "OPERATING", 450.0, 210.0, neoMetropolis));
                }
            }
        };
    }
}
