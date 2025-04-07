/**
 * Algorithme de recherche locale optimisant plusieurs paramètres avec pondérations
 * @param {Object} graph - Le graphe représentant les connexions entre les nœuds
 * @param {string} start - Le nœud de départ
 * @param {string} end - Le nœud d'arrivée
 * @param {Object} weights - Objet contenant les pondérations pour chaque paramètre
 * @returns {Object} - Le chemin trouvé et ses valeurs
 */
function rechercheLocaleMultiParametres(graph, start, end, weights) {
    console.log(`\n===== DÉBUT DE LA RECHERCHE DE ${start} à ${end} =====`);
    console.log("Pondérations utilisées:", weights);
    
    // Vérifier que les poids sont valides
    const parametreNames = Object.keys(weights);
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    
    if (Math.abs(totalWeight - 1) > 0.001) {
      console.log(`Attention: La somme des pondérations (${totalWeight}) n'est pas égale à 1. Normalisation automatique appliquée.`);
      for (const param in weights) {
        weights[param] = weights[param] / totalWeight;
      }
      console.log("Pondérations normalisées:", weights);
    }
    
    // Vérifications des entrées
    if (!graph[start] || !graph[end]) {
      console.log("Erreur: Nœuds de départ ou d'arrivée invalides");
      return { 
        path: [], 
        parametres: {}, 
        message: "Nœuds de départ ou d'arrivée invalides" 
      };
    }
    
    // Vérifier que tous les paramètres existent dans le graphe
    let firstEdge = null;
    for (const node in graph) {
      for (const neighbor in graph[node]) {
        firstEdge = graph[node][neighbor];
        break;
      }
      if (firstEdge) break;
    }
    
    if (firstEdge) {
      for (const param of parametreNames) {
        if (firstEdge[param] === undefined) {
          console.log(`Erreur: Le paramètre '${param}' n'existe pas dans le graphe`);
          return { 
            path: [], 
            parametres: {}, 
            message: `Le paramètre '${param}' n'existe pas dans le graphe` 
          };
        }
      }
    }
    
    // Normaliser les valeurs dans le graphe
    const maxValues = {};
    for (const param of parametreNames) {
      maxValues[param] = findMaxValue(graph, param);
      console.log(`Valeur maximale trouvée pour ${param}: ${maxValues[param]}`);
    }
    
    // Initialisation
    let currentNode = start;
    let path = [currentNode];
    const totalValues = {};
    for (const param of parametreNames) {
      totalValues[param] = 0;
    }
    let isStuck = false;
    
    console.log(`Départ du nœud ${currentNode}`);
    
    // Boucle principale - continue jusqu'à ce qu'on soit bloqué ou qu'on atteigne la destination
    let iteration = 1;
    while (!isStuck && currentNode !== end) {
      console.log(`\n--- Itération ${iteration} ---`);
      console.log(`Position actuelle: ${currentNode}`);
      console.log(`Chemin parcouru jusqu'ici: ${path.join(' -> ')}`);
      console.log("Valeurs totales actuelles:", totalValues);
      
      // Obtenir tous les voisins du nœud actuel
      const neighbors = graph[currentNode];
      
      // Si aucun voisin, nous sommes bloqués
      if (Object.keys(neighbors).length === 0) {
        console.log(`Le nœud ${currentNode} n'a aucun voisin. Recherche bloquée.`);
        return { 
          path, 
          parametres: totalValues, 
          message: "Bloqué sans pouvoir atteindre la destination" 
        };
      }
      
      console.log("Évaluation des voisins disponibles:");
      
      // Trouver le meilleur voisin selon les critères pondérés
      let bestNeighbor = null;
      let bestScore = Infinity;
      
      for (const neighbor in neighbors) {
        // Éviter de revenir sur un nœud déjà visité
        if (path.includes(neighbor)) {
          console.log(`  ${neighbor}: déjà visité, ignoré`);
          continue;
        }
        
        // Calculer le score combiné pour tous les paramètres
        let score = 0;
        const normalizedValues = {};
        
        console.log(`  ${neighbor}: `);
        for (const param of parametreNames) {
          const value = neighbors[neighbor][param];
          const normalizedValue = value / maxValues[param];
          normalizedValues[param] = normalizedValue;
          score += weights[param] * normalizedValue;
          
          console.log(`    ${param}=${value}, normalisé=${normalizedValue.toFixed(4)}`);
        }
        
        console.log(`    Score combiné = ${score.toFixed(4)}`);
        
        if (score < bestScore) {
          bestScore = score;
          bestNeighbor = neighbor;
          console.log(`    ✓ Meilleur voisin pour l'instant: ${bestNeighbor} (score: ${bestScore.toFixed(4)})`);
        } else {
          console.log(`    ✗ Score moins bon que ${bestNeighbor} (${bestScore.toFixed(4)})`);
        }
      }
      
      // Si aucun meilleur voisin n'est trouvé, nous sommes bloqués
      if (bestNeighbor === null) {
        console.log("Aucun voisin disponible. Recherche bloquée dans un minimum local.");
        isStuck = true;
        break;
      }
      
      // Se déplacer vers le meilleur voisin
      console.log(`\nDéplacement de ${currentNode} vers ${bestNeighbor} (meilleur score: ${bestScore.toFixed(4)})`);
      
      // Mettre à jour les valeurs totales pour tous les paramètres
      for (const param of parametreNames) {
        const newValue = neighbors[bestNeighbor][param];
        totalValues[param] += newValue;
        console.log(`${param} ajouté: +${newValue}, Nouveau total: ${totalValues[param]}`);
      }
      
      currentNode = bestNeighbor;
      path.push(currentNode);
      
      // Si on a atteint la destination, on s'arrête
      if (currentNode === end) {
        console.log(`\nDestination ${end} atteinte!`);
        break;
      }
      
      iteration++;
    }
    
    // Retourner le résultat
    console.log(`\n===== FIN DE LA RECHERCHE =====`);
    console.log(`Chemin final: ${path.join(' -> ')}`);
    console.log("Valeurs totales finales:", totalValues);
    
    const message = currentNode !== end ? "N'a pas pu atteindre la destination" : 
                   isStuck ? "Bloqué dans un minimum local" : "Chemin trouvé";
    console.log(`Statut: ${message}`);
    
    return {
      path,
      parametres: totalValues,
      message
    };
  }
  
  /**
   * Trouve la valeur maximale d'un critère dans le graphe
   */
  function findMaxValue(graph, parametre) {
    let maxValue = 0;
    for (const node in graph) {
      for (const neighbor in graph[node]) {
        if (graph[node][neighbor][parametre] > maxValue) {
          maxValue = graph[node][neighbor][parametre];
        }
      }
    }
    return maxValue === 0 ? 1 : maxValue; // Éviter division par zéro
  }
  
  /**
   * Explore tous les chemins possibles entre deux nœuds et calcule leurs scores
   */
  function explorerTousChemins(graph, start, end, parametres, path = [], values = null) {
    if (values === null) {
      values = {};
      for (const param of parametres) {
        values[param] = 0;
      }
    }
    
    path = [...path, start];
    
    if (start === end) {
      return [{ path, parametres: {...values} }];
    }
    
    let results = [];
    for (const neighbor in graph[start]) {
      if (!path.includes(neighbor)) {
        const newValues = {...values};
        for (const param of parametres) {
          newValues[param] += graph[start][neighbor][param];
        }
        
        const newResults = explorerTousChemins(
          graph,
          neighbor,
          end,
          parametres,
          path,
          newValues
        );
        results = [...results, ...newResults];
      }
    }
    
    return results;
  }
  
  /**
   * Calcule le score combiné pour un chemin donné
   */
  function calculerScore(cheminData, weights, maxValues) {
    let score = 0;
    for (const param in weights) {
      const normalizedValue = cheminData.parametres[param] / maxValues[param];
      score += weights[param] * normalizedValue;
    }
    return score;
  }
  
  // Exemple d'utilisation avec un graphe qui inclut plus de paramètres
  const graphMultiParam = {
    A: {
      B: { distance: 12, cost: 30, time: 5, risk: 2, comfort: 8 },
      C: { distance: 6, cost: 60, time: 8, risk: 5, comfort: 4 },
    },
    B: {
      C: { distance: 9, cost: 15, time: 3, risk: 1, comfort: 7 },
      D: { distance: 20, cost: 90, time: 15, risk: 4, comfort: 5 },
      E: { distance: 17, cost: 70, time: 10, risk: 3, comfort: 6 },
    },
    C: {
      E: { distance: 14, cost: 50, time: 7, risk: 2, comfort: 5 },
    },
    D: {
      F: { distance: 40, cost: 100, time: 20, risk: 6, comfort: 3 },
    },
    E: {
      F: { distance: 50, cost: 97, time: 25, risk: 3, comfort: 7 },
    },
    F: {},
  };
  
  // Exécution avec différentes combinaisons de paramètres
  console.log("\n\n=========================================================");
  console.log("EXÉCUTION AVEC 2 PARAMÈTRES (distance et coût)");
  console.log("=========================================================");
  const poids2Param = { distance: 0.5, cost: 0.5 };
  const result2Param = rechercheLocaleMultiParametres(graphMultiParam, 'A', 'F', poids2Param);
  console.log("RÉSULTAT FINAL:", result2Param);
  
  console.log("\n\n=========================================================");
  console.log("EXÉCUTION AVEC 3 PARAMÈTRES (distance, coût et temps)");
  console.log("=========================================================");
  const poids3Param = { distance: 0.3, cost: 0.3, time: 0.4 };
  const result3Param = rechercheLocaleMultiParametres(graphMultiParam, 'A', 'F', poids3Param);
  console.log("RÉSULTAT FINAL:", result3Param);
  
  console.log("\n\n=========================================================");
  console.log("EXÉCUTION AVEC 5 PARAMÈTRES (distance, coût, temps, risque, confort)");
  console.log("=========================================================");
  const poids5Param = { distance: 0.2, cost: 0.2, time: 0.2, risk: 0.2, comfort: 0.2 };
  const result5Param = rechercheLocaleMultiParametres(graphMultiParam, 'A', 'F', poids5Param);
  console.log("RÉSULTAT FINAL:", result5Param);
  
  console.log("\n\n=========================================================");
  console.log("EXÉCUTION AVEC PRÉFÉRENCE FORTE POUR LE CONFORT");
  console.log("=========================================================");
  const poidsConfort = { distance: 0.1, cost: 0.1, time: 0.1, risk: 0.1, comfort: 0.6 };
  const resultConfort = rechercheLocaleMultiParametres(graphMultiParam, 'A', 'F', poidsConfort);
  console.log("RÉSULTAT FINAL:", resultConfort);
  
  // Analyser tous les chemins possibles pour comparer
  console.log("\n\n=========================================================");
  console.log("ANALYSE DE TOUS LES CHEMINS POSSIBLES AVEC 5 PARAMÈTRES");
  console.log("=========================================================");
  
  const parametresAnalyse = ["distance", "cost", "time", "risk", "comfort"];
  const maxValuesAnalyse = {};
  for (const param of parametresAnalyse) {
    maxValuesAnalyse[param] = findMaxValue(graphMultiParam, param);
  }
  
  const tousChemins = explorerTousChemins(graphMultiParam, 'A', 'F', parametresAnalyse);
  tousChemins.forEach((result, index) => {
    console.log(`\nChemin ${index + 1}: ${result.path.join(' -> ')}`);
    console.log("Paramètres:", result.parametres);
    
    const score2Param = calculerScore(result, poids2Param, maxValuesAnalyse);
    const score3Param = calculerScore(result, poids3Param, maxValuesAnalyse);
    const score5Param = calculerScore(result, poids5Param, maxValuesAnalyse);
    const scoreConfort = calculerScore(result, poidsConfort, maxValuesAnalyse);
    
    console.log(`Score avec 2 paramètres: ${score2Param.toFixed(4)}`);
    console.log(`Score avec 3 paramètres: ${score3Param.toFixed(4)}`);
    console.log(`Score avec 5 paramètres: ${score5Param.toFixed(4)}`);
    console.log(`Score avec préférence confort: ${scoreConfort.toFixed(4)}`);
  });
  
  // Comparer les résultats de la recherche locale avec l'analyse exhaustive
  console.log("\n\nComparaison des résultats:");
  console.log(`2 paramètres: ${result2Param.path.join(' -> ')}`);
  console.log(`3 paramètres: ${result3Param.path.join(' -> ')}`);
  console.log(`5 paramètres: ${result5Param.path.join(' -> ')}`);
  console.log(`Préférence confort: ${resultConfort.path.join(' -> ')}`);
  
  // Fonction pour trouver le meilleur chemin selon certains critères
  function trouverMeilleurChemin(chemins, weights, maxValues) {
    let meilleurChemin = null;
    let meilleurScore = Infinity;
    
    for (const chemin of chemins) {
      const score = calculerScore(chemin, weights, maxValues);
      if (score < meilleurScore) {
        meilleurScore = score;
        meilleurChemin = chemin;
      }
    }
    
    return { meilleurChemin, score: meilleurScore };
  }
  
  console.log("\n\nMeilleurs chemins selon l'analyse exhaustive:");
  const meilleur2Param = trouverMeilleurChemin(tousChemins, poids2Param, maxValuesAnalyse);
  console.log(`2 paramètres: ${meilleur2Param.meilleurChemin.path.join(' -> ')} (score: ${meilleur2Param.score.toFixed(4)})`);
  
  const meilleur3Param = trouverMeilleurChemin(tousChemins, poids3Param, maxValuesAnalyse);
  console.log(`3 paramètres: ${meilleur3Param.meilleurChemin.path.join(' -> ')} (score: ${meilleur3Param.score.toFixed(4)})`);
  
  const meilleur5Param = trouverMeilleurChemin(tousChemins, poids5Param, maxValuesAnalyse);
  console.log(`5 paramètres: ${meilleur5Param.meilleurChemin.path.join(' -> ')} (score: ${meilleur5Param.score.toFixed(4)})`);
  
  const meilleurConfort = trouverMeilleurChemin(tousChemins, poidsConfort, maxValuesAnalyse);
  console.log(`Préférence confort: ${meilleurConfort.meilleurChemin.path.join(' -> ')} (score: ${meilleurConfort.score.toFixed(4)})`);