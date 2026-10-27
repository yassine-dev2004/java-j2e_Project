package com.aether.service.impl;

import com.aether.model.City;
import com.aether.repository.CityRepository;
import com.aether.service.CityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CityServiceImpl implements CityService {

    private final CityRepository cityRepository;

    @Autowired
    public CityServiceImpl(CityRepository cityRepository) {
        this.cityRepository = cityRepository;
    }

    @Override
    public List<City> getAllCities() {
        return cityRepository.findAll();
    }

    @Override
    public Optional<City> getCityById(Long id) {
        return cityRepository.findById(id);
    }

    @Override
    public City saveCity(City city) {
        if (city.getId() != null) {
            return updateCity(city.getId(), city);
        }
        return cityRepository.save(city);
    }

    @Override
    public City updateCity(Long id, City cityDetails) {
        City existing = cityRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("City with id " + id + " not found"));
        existing.setName(cityDetails.getName());
        existing.setTotalPopulation(cityDetails.getTotalPopulation());
        existing.setTotalVehicles(cityDetails.getTotalVehicles());
        existing.setTotalBusinesses(cityDetails.getTotalBusinesses());
        if (cityDetails.getEnergyConsumption() > 0) {
            existing.setEnergyConsumption(cityDetails.getEnergyConsumption());
        }
        if (cityDetails.getEconomicIndex() > 0) {
            existing.setEconomicIndex(cityDetails.getEconomicIndex());
        }
        return cityRepository.save(existing);
    }

    @Override
    public void deleteCity(Long id) {
        cityRepository.deleteById(id);
    }

    @Override
    public City initDefaultCity() {
        return cityRepository.findByName("Neo-Metropolis")
                .orElseGet(() -> cityRepository.save(new City("Neo-Metropolis", 12500, 4800, 950)));
    }
}
