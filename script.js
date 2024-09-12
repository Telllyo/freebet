let equipes = {};
let nombreDeMatchs = 3;
let equipesEditees = false;

// Activer ou désactiver le mode nuit
document.getElementById('modeNuitToggle').addEventListener('change', function () {
    if (this.checked) {
        document.body.classList.add('night-mode');
    } else {
        document.body.classList.remove('night-mode');
    }
});

function ajusterNombreDeMatchs() {
    nombreDeMatchs = parseInt(document.getElementById('nbMatchs').value);
    genererTableauCotes();
    genererFormulaireEquipes();
    resetCotes();
}

function genererTableauCotes() {
    const bodyCotes = document.getElementById('bodyCotes');
    bodyCotes.innerHTML = ''; // Vider le tableau

    for (let i = 1; i <= nombreDeMatchs; i++) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <th id="match${i}Header">Match ${i}</th>
            <td><input type="number" id="cote1Match${i}" placeholder="Cote 1" oninput="mettreAJourTRJ(); calculerMises();"></td>
            <td><input type="number" id="coteNMatch${i}" placeholder="Cote N" oninput="mettreAJourTRJ(); calculerMises();"></td>
            <td><input type="number" id="cote2Match${i}" placeholder="Cote 2" oninput="mettreAJourTRJ(); calculerMises();"></td>
            <td><span id="trjMatch${i}">0</span></td>
        `;
        bodyCotes.appendChild(row);
    }
}

function genererFormulaireEquipes() {
    const inputEquipes = document.getElementById('inputEquipes');
    inputEquipes.innerHTML = ''; // Vider le formulaire des équipes

    for (let i = 1; i <= nombreDeMatchs; i++) {
        const div = document.createElement('div');
        div.innerHTML = `
            <label>Match ${i} : Domicile :</label>
            <input type="text" id="equipe1Match${i}" placeholder="Équipe domicile">
            <label>Extérieur :</label>
            <input type="text" id="equipe2Match${i}" placeholder="Équipe extérieur">
        `;
        inputEquipes.appendChild(div);
    }
}

function afficherEditionEquipes() {
    const container = document.getElementById('editEquipesContainer');
    container.style.display = container.style.display === 'none' || container.style.display === '' ? 'block' : 'none';
}

function validerEquipes() {
    let erreurs = false;
    for (let i = 1; i <= nombreDeMatchs; i++) {
        const equipe1 = document.getElementById(`equipe1Match${i}`).value;
        const equipe2 = document.getElementById(`equipe2Match${i}`).value;
        if (!equipe1 || !equipe2) {
            erreurs = true;
        }
        equipes[i] = { equipe1, equipe2 };
    }

    if (erreurs) {
        document.getElementById('errorEquipes').style.display = 'block';
        return;
    }

    equipesEditees = true;  // Marquer les équipes comme éditées
    document.getElementById('errorEquipes').style.display = 'none';
    document.getElementById('editEquipesContainer').style.display = 'none';
    document.getElementById('btnSupprimerEquipes').style.display = 'inline-block';

    for (let i = 1; i <= nombreDeMatchs; i++) {
        document.getElementById(`match${i}Header`).innerText = `${equipes[i].equipe1} vs ${equipes[i].equipe2}`;
    }
    calculerMises();
}

function annulerEdition() {
    document.getElementById('editEquipesContainer').style.display = 'none';
}

function resetCotes() {
    for (let i = 1; i <= nombreDeMatchs; i++) {
        document.getElementById(`cote1Match${i}`).value = '';
        document.getElementById(`coteNMatch${i}`).value = '';
        document.getElementById(`cote2Match${i}`).value = '';
        document.getElementById(`trjMatch${i}`).innerText = '0';
    }
    supprimerEquipes();
    document.getElementById('detailsMises').style.display = 'none';  // Cacher le tableau des mises
    document.getElementById('resultats').style.display = 'none';  // Cacher les résultats
}

function supprimerEquipes() {
    equipes = {};
    equipesEditees = false;
    for (let i = 1; i <= nombreDeMatchs; i++) {
        document.getElementById(`match${i}Header`).innerText = `Match ${i}`;
    }
    document.getElementById('btnSupprimerEquipes').style.display = 'none';
    calculerMises();
}

function mettreAJourTRJ() {
    for (let i = 1; i <= nombreDeMatchs; i++) {
        const cote1 = parseFloat(document.getElementById(`cote1Match${i}`).value) || 0;
        const coteN = parseFloat(document.getElementById(`coteNMatch${i}`).value) || 0;
        const cote2 = parseFloat(document.getElementById(`cote2Match${i}`).value) || 0;
        const trj = calculerTRJ(cote1, coteN, cote2);
        document.getElementById(`trjMatch${i}`).innerText = (trj * 100).toFixed(2);
    }
}

function calculerTRJ(cote1, coteN, cote2) {
    if (cote1 > 0 && coteN > 0 && cote2 > 0) {
        return 1 / ((1 / cote1) + (1 / coteN) + (1 / cote2));
    }
    return 0;
}

function calculerMises() {
    const gainDesire = parseFloat(document.getElementById('gainDesire').value);
    if (!toutesLesCotesRemplies()) return;

    const combinaisons = genererCombinaisons(nombreDeMatchs);
    let totalMise = 0;
    const tbody = document.getElementById('detailMises');
    tbody.innerHTML = '';

    combinaisons.forEach((combinaison, index) => {
        let cote = 1;
        let description = equipesEditees ? getDescriptionCombinaison(combinaison) : '';
        for (let i = 0; i < combinaison.length; i++) {
            const result = combinaison[i];
            cote *= parseFloat(document.getElementById(`cote${result}Match${i + 1}`).value);
        }
        const mise = (gainDesire / (cote - 1)).toFixed(2);
        totalMise += parseFloat(mise);

        const row = `
            <tr>
                <td>${index + 1}</td>
                <td>${combinaison}${description ? ' - ' + description : ''}</td>
                <td>${cote.toFixed(2)}</td>
                <td>${mise} €</td>
                <td>${((cote - 1) * mise).toFixed(2)} €</td>
            </tr>
        `;
        tbody.innerHTML += row;
    });

    document.getElementById('totalMise').innerText = totalMise.toFixed(2);
    document.getElementById('tauxConversion').innerText = ((gainDesire / totalMise) * 100).toFixed(2);
    afficherOuMasquerTableau();
}

function getDescriptionCombinaison(combinaison) {
    let description = '';
    for (let i = 0; i < combinaison.length; i++) {
        if (combinaison[i] === '1') {
            description += equipes[i + 1]?.equipe1 || 'Equipe1';
        } else if (combinaison[i] === 'N') {
            description += 'Nul';
        } else if (combinaison[i] === '2') {
            description += equipes[i + 1]?.equipe2 || 'Equipe2';
        }
        if (i < combinaison.length - 1) {
            description += ' / ';
        }
    }
    return description;
}

function toutesLesCotesRemplies() {
    for (let i = 1; i <= nombreDeMatchs; i++) {
        if (!document.getElementById(`cote1Match${i}`).value || !document.getElementById(`coteNMatch${i}`).value || !document.getElementById(`cote2Match${i}`).value) {
            return false;
        }
    }
    return true;
}

function genererCombinaisons(nbMatchs) {
    const resultats = ['1', 'N', '2'];
    const combinaisons = [];

    const genererCombinaison = (combinaison, niveau) => {
        if (niveau === nbMatchs) {
            combinaisons.push(combinaison);
            return;
        }
        for (let i = 0; i < resultats.length; i++) {
            genererCombinaison(combinaison + resultats[i], niveau + 1);
        }
    };

    genererCombinaison('', 0);
    return combinaisons;
}

function afficherOuMasquerTableau() {
    const detailsMises = document.getElementById('detailsMises');
    const resultats = document.getElementById('resultats');
    if (toutesLesCotesRemplies()) {
        detailsMises.style.display = 'block';
        resultats.style.display = 'block';
    } else {
        detailsMises.style.display = 'none';
        resultats.style.display = 'none';
    }
}

// Appel initial pour générer le tableau
ajusterNombreDeMatchs();
