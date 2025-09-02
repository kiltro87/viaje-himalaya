/**
 * 🗺️ ROUTE OPTIMIZER - RUTAS OPTIMIZADAS ENTRE PUNTOS
 * 
 * Optimiza rutas entre puntos de interés del día usando algoritmos de TSP
 * Considera distancias, tiempos de visita y horarios de apertura
 * 
 * @author David Ferrer Figueroa
 * @version 1.0.0
 * @since 2024
 */

import Logger from './Logger.js';
import { tripConfig } from '../config/tripConfig.js';

export class RouteOptimizer {
    constructor() {
        this.routes = new Map();
        this.distanceMatrix = new Map();
        
        this.init();
    }
    
    init() {
        this.precomputeRoutes();
        Logger.success('RouteOptimizer initialized');
    }
    
    async precomputeRoutes() {
        for (const day of tripConfig.itinerary) {
            if (day.places && day.places.length > 1) {
                const optimizedRoute = await this.optimizeDayRoute(day);
                this.routes.set(day.id, optimizedRoute);
            }
        }
    }
    
    async optimizeDayRoute(day) {
        const places = day.places.filter(p => p.coords && p.coords.length === 2);
        if (places.length < 2) return { places, totalDistance: 0, totalTime: 0 };
        
        // Calcular matriz de distancias
        const matrix = await this.calculateDistanceMatrix(places);
        
        // Aplicar algoritmo de optimización (TSP simplificado)
        const optimizedOrder = this.solveTSP(places, matrix);
        
        // Calcular métricas de la ruta optimizada
        const routeMetrics = this.calculateRouteMetrics(optimizedOrder, matrix);
        
        return {
            dayId: day.id,
            originalPlaces: places,
            optimizedPlaces: optimizedOrder,
            distanceMatrix: matrix,
            ...routeMetrics,
            recommendations: this.generateRouteRecommendations(optimizedOrder, day)
        };
    }
    
    async calculateDistanceMatrix(places) {
        const matrix = {};
        
        for (let i = 0; i < places.length; i++) {
            matrix[i] = {};
            for (let j = 0; j < places.length; j++) {
                if (i === j) {
                    matrix[i][j] = { distance: 0, time: 0 };
                } else {
                    const distance = this.calculateHaversineDistance(
                        places[i].coords[0], places[i].coords[1],
                        places[j].coords[0], places[j].coords[1]
                    );
                    
                    const time = this.estimateTravelTime(distance, places[i], places[j]);
                    matrix[i][j] = { distance, time };
                }
            }
        }
        
        return matrix;
    }
    
    calculateHaversineDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Radio de la Tierra en km
        const dLat = this.toRadians(lat2 - lat1);
        const dLng = this.toRadians(lng2 - lng1);
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
    
    toRadians(degrees) {
        return degrees * (Math.PI/180);
    }
    
    estimateTravelTime(distanceKm, fromPlace, toPlace) {
        // Velocidades estimadas según contexto
        let speedKmh = 4; // Caminando por defecto
        
        if (distanceKm > 2) {
            speedKmh = 15; // Transporte local/taxi
        }
        
        if (distanceKm > 10) {
            speedKmh = 40; // Transporte rápido
        }
        
        // Ajustes por tipo de lugar
        if (this.isUrbanArea(fromPlace) && this.isUrbanArea(toPlace)) {
            speedKmh *= 0.8; // Tráfico urbano
        }
        
        if (this.isMountainArea(fromPlace) || this.isMountainArea(toPlace)) {
            speedKmh *= 0.6; // Terreno montañoso
        }
        
        return (distanceKm / speedKmh) * 60; // minutos
    }
    
    isUrbanArea(place) {
        const urbanKeywords = ['thamel', 'market', 'bazaar', 'city', 'town'];
        return urbanKeywords.some(keyword => 
            place.name.toLowerCase().includes(keyword) ||
            (place.description || '').toLowerCase().includes(keyword)
        );
    }
    
    isMountainArea(place) {
        const mountainKeywords = ['mountain', 'peak', 'monastery', 'temple', 'viewpoint'];
        return mountainKeywords.some(keyword => 
            place.name.toLowerCase().includes(keyword) ||
            (place.description || '').toLowerCase().includes(keyword)
        );
    }
    
    solveTSP(places, matrix) {
        if (places.length <= 2) return places;
        
        // Para grupos pequeños, usar fuerza bruta optimizada
        if (places.length <= 6) {
            return this.bruteForceTSP(places, matrix);
        }
        
        // Para grupos más grandes, usar heurística nearest neighbor mejorada
        return this.nearestNeighborTSP(places, matrix);
    }
    
    bruteForceTSP(places, matrix) {
        const n = places.length;
        let bestRoute = [...places];
        let bestDistance = this.calculateTotalDistance(places, matrix);
        
        // Generar todas las permutaciones (excepto el primer punto fijo)
        const permutations = this.generatePermutations(places.slice(1));
        
        for (const perm of permutations) {
            const route = [places[0], ...perm];
            const distance = this.calculateTotalDistance(route, matrix);
            
            if (distance < bestDistance) {
                bestDistance = distance;
                bestRoute = route;
            }
        }
        
        return bestRoute;
    }
    
    nearestNeighborTSP(places, matrix) {
        const visited = new Set();
        const route = [];
        
        // Empezar desde el primer lugar
        let current = 0;
        route.push(places[current]);
        visited.add(current);
        
        while (visited.size < places.length) {
            let nearest = -1;
            let minDistance = Infinity;
            
            for (let i = 0; i < places.length; i++) {
                if (!visited.has(i)) {
                    const distance = matrix[current][i].distance;
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearest = i;
                    }
                }
            }
            
            if (nearest !== -1) {
                route.push(places[nearest]);
                visited.add(nearest);
                current = nearest;
            }
        }
        
        // Optimización 2-opt
        return this.twoOptImprovement(route, matrix);
    }
    
    twoOptImprovement(route, matrix) {
        let improved = true;
        let bestRoute = [...route];
        
        while (improved) {
            improved = false;
            
            for (let i = 1; i < route.length - 2; i++) {
                for (let j = i + 1; j < route.length; j++) {
                    if (j - i === 1) continue;
                    
                    const newRoute = this.twoOptSwap(bestRoute, i, j);
                    const currentDistance = this.calculateTotalDistance(bestRoute, matrix);
                    const newDistance = this.calculateTotalDistance(newRoute, matrix);
                    
                    if (newDistance < currentDistance) {
                        bestRoute = newRoute;
                        improved = true;
                    }
                }
            }
        }
        
        return bestRoute;
    }
    
    twoOptSwap(route, i, j) {
        const newRoute = [...route];
        
        // Invertir el segmento entre i y j
        while (i < j) {
            [newRoute[i], newRoute[j]] = [newRoute[j], newRoute[i]];
            i++;
            j--;
        }
        
        return newRoute;
    }
    
    generatePermutations(arr) {
        if (arr.length <= 1) return [arr];
        
        const result = [];
        for (let i = 0; i < arr.length; i++) {
            const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
            const perms = this.generatePermutations(rest);
            
            for (const perm of perms) {
                result.push([arr[i], ...perm]);
            }
        }
        
        return result;
    }
    
    calculateTotalDistance(route, matrix) {
        let total = 0;
        
        for (let i = 0; i < route.length - 1; i++) {
            const fromIndex = route.findIndex(p => p === route[i]);
            const toIndex = route.findIndex(p => p === route[i + 1]);
            total += matrix[fromIndex][toIndex].distance;
        }
        
        return total;
    }
    
    calculateRouteMetrics(route, matrix) {
        let totalDistance = 0;
        let totalTravelTime = 0;
        let totalVisitTime = 0;
        
        for (let i = 0; i < route.length - 1; i++) {
            const fromIndex = route.findIndex(p => p === route[i]);
            const toIndex = route.findIndex(p => p === route[i + 1]);
            
            totalDistance += matrix[fromIndex][toIndex].distance;
            totalTravelTime += matrix[fromIndex][toIndex].time;
        }
        
        // Tiempo estimado de visita por lugar
        route.forEach(place => {
            totalVisitTime += this.estimateVisitTime(place);
        });
        
        return {
            totalDistance: Math.round(totalDistance * 100) / 100,
            totalTravelTime: Math.round(totalTravelTime),
            totalVisitTime: Math.round(totalVisitTime),
            totalDayTime: Math.round(totalTravelTime + totalVisitTime),
            efficiency: this.calculateEfficiency(totalTravelTime, totalVisitTime)
        };
    }
    
    estimateVisitTime(place) {
        const name = place.name.toLowerCase();
        const description = (place.description || '').toLowerCase();
        
        // Tiempos base por tipo de lugar
        if (name.includes('museum') || name.includes('museo')) return 90;
        if (name.includes('temple') || name.includes('monastery')) return 45;
        if (name.includes('market') || name.includes('bazaar')) return 60;
        if (name.includes('viewpoint') || name.includes('mirador')) return 30;
        if (name.includes('palace') || name.includes('palacio')) return 120;
        if (name.includes('stupa')) return 30;
        if (name.includes('dzong')) return 60;
        
        // Por defecto
        return 45;
    }
    
    calculateEfficiency(travelTime, visitTime) {
        const totalTime = travelTime + visitTime;
        return totalTime > 0 ? Math.round((visitTime / totalTime) * 100) : 0;
    }
    
    generateRouteRecommendations(route, day) {
        const recommendations = [];
        
        // Recomendación de horario
        const totalTime = this.calculateRouteMetrics(route, this.distanceMatrix.get(day.id) || {}).totalDayTime;
        
        if (totalTime > 480) { // Más de 8 horas
            recommendations.push({
                type: 'warning',
                message: 'Día muy intenso. Considera dividir las visitas en 2 días.',
                icon: '⚠️'
            });
        }
        
        if (totalTime < 240) { // Menos de 4 horas
            recommendations.push({
                type: 'suggestion',
                message: 'Tienes tiempo libre. Considera explorar la zona o descansar.',
                icon: '💡'
            });
        }
        
        // Recomendaciones de transporte
        const longDistances = this.findLongDistances(route, this.distanceMatrix.get(day.id) || {});
        if (longDistances.length > 0) {
            recommendations.push({
                type: 'transport',
                message: `Considera taxi/transporte para: ${longDistances.join(', ')}`,
                icon: '🚕'
            });
        }
        
        // Recomendación de orden por horarios
        const timeBasedOrder = this.suggestTimeBasedOrder(route);
        if (timeBasedOrder.length > 0) {
            recommendations.push({
                type: 'timing',
                message: `Mejor horario: ${timeBasedOrder.join(' → ')}`,
                icon: '🕐'
            });
        }
        
        return recommendations;
    }
    
    findLongDistances(route, matrix) {
        const longDistances = [];
        
        for (let i = 0; i < route.length - 1; i++) {
            const fromIndex = route.findIndex(p => p === route[i]);
            const toIndex = route.findIndex(p => p === route[i + 1]);
            
            if (matrix[fromIndex] && matrix[fromIndex][toIndex] && 
                matrix[fromIndex][toIndex].distance > 3) {
                longDistances.push(`${route[i].name} → ${route[i + 1].name}`);
            }
        }
        
        return longDistances;
    }
    
    suggestTimeBasedOrder(route) {
        // Sugerencias simples basadas en tipo de lugar
        const morningPlaces = route.filter(p => 
            p.name.toLowerCase().includes('sunrise') || 
            p.name.toLowerCase().includes('market')
        );
        
        const afternoonPlaces = route.filter(p => 
            p.name.toLowerCase().includes('museum') ||
            p.name.toLowerCase().includes('palace')
        );
        
        const eveningPlaces = route.filter(p => 
            p.name.toLowerCase().includes('sunset') ||
            p.name.toLowerCase().includes('restaurant')
        );
        
        const suggestions = [];
        if (morningPlaces.length > 0) suggestions.push(`Mañana: ${morningPlaces[0].name}`);
        if (afternoonPlaces.length > 0) suggestions.push(`Tarde: ${afternoonPlaces[0].name}`);
        if (eveningPlaces.length > 0) suggestions.push(`Noche: ${eveningPlaces[0].name}`);
        
        return suggestions;
    }
    
    // API pública
    
    /**
     * Obtiene la ruta optimizada para un día específico
     */
    getOptimizedRoute(dayId) {
        return this.routes.get(dayId);
    }
    
    /**
     * Obtiene todas las rutas optimizadas
     */
    getAllRoutes() {
        return Array.from(this.routes.values());
    }
    
    /**
     * Recalcula la ruta para un día específico
     */
    async recalculateRoute(dayId) {
        const day = tripConfig.itinerary.find(d => d.id === dayId);
        if (day) {
            const optimizedRoute = await this.optimizeDayRoute(day);
            this.routes.set(dayId, optimizedRoute);
            return optimizedRoute;
        }
        return null;
    }
    
    /**
     * Obtiene estadísticas generales de rutas
     */
    getRouteStats() {
        const routes = Array.from(this.routes.values());
        
        return {
            totalRoutes: routes.length,
            averageDistance: routes.reduce((sum, r) => sum + r.totalDistance, 0) / routes.length,
            averageTime: routes.reduce((sum, r) => sum + r.totalDayTime, 0) / routes.length,
            averageEfficiency: routes.reduce((sum, r) => sum + r.efficiency, 0) / routes.length,
            totalOptimizedDistance: routes.reduce((sum, r) => sum + r.totalDistance, 0)
        };
    }
}

// Exportar instancia singleton
export const routeOptimizer = new RouteOptimizer();
export default routeOptimizer;
