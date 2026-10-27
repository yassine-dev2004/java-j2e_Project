package com.aether.controller;

import com.aether.model.City;
import com.aether.service.CityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/cities")
public class CityController {

    private final CityService cityService;

    @Autowired
    public CityController(CityService cityService) {
        this.cityService = cityService;
    }

    @GetMapping
    public String listCities(Model model) {
        model.addAttribute("cities", cityService.getAllCities());
        return "city/list";
    }

    @GetMapping("/new")
    public String showCreateForm(Model model) {
        model.addAttribute("city", new City());
        return "city/form";
    }

    @GetMapping("/edit/{id}")
    public String showEditForm(@PathVariable Long id, Model model) {
        City city = cityService.getCityById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid city Id: " + id));
        model.addAttribute("city", city);
        return "city/form";
    }

    @PostMapping
    public String saveCity(@ModelAttribute City city) {
        cityService.saveCity(city);
        return "redirect:/cities";
    }

    @GetMapping("/delete/{id}")
    public String deleteCity(@PathVariable Long id) {
        cityService.deleteCity(id);
        return "redirect:/cities";
    }
}
