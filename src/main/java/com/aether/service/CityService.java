package com.aether.service;

import com.aether.model.City;
import java.util.List;
import java.util.Optional;

public interface CityService {
    List<City> getAllCities();
    Optional<City> getCityById(Long id);
    City saveCity(City city);
    City updateCity(Long id, City city);
    void deleteCity(Long id);
    City initDefaultCity();
}
