# Skill de Navegação: Automação de Aulas Rocketseat

Este documento descreve os seletores e o fluxo para assistir aulas na plataforma Rocketseat (FTR).

## 1. Seletores CSS Importantes

### A. Video Player (Iframe)
* **Iframe:** `iframe[title="Rocketseat Bunny Video"]`
* **Play/Pause:** `button[aria-label="Play"]`, `button[aria-label="Pause"]`
* **Settings:** `button[aria-label="Settings"]`
* **Playback Speed Menu:** `menuitem:has-text("Speed")`
* **Speed 2x Option:** `menuitemradio:has-text("2×")`

### B. Controle da Aula
* **Duração (Sidebar):** `.sidebar-item-duration` (ou similar, ex: `ref=e856`)
* **Botão Marcar como Assistida:** `button:has-text("Marcar como assistida")` (ref=e817)
* **Status Concluído (Verde):** Quando assistida, o ícone na sidebar muda ou o container ganha uma classe (ex: `.completed`, `.checked`). Verificado no DOM como uma mudança de `img` ou cor do texto.
* **Botão Próximo Conteúdo:** `button:has-text("Próximo conteúdo")` (ref=e752)

## 2. Fluxo de Operação (Fast-Track)

1. **Entrar na Sala:** Clicar no módulo ou no botão "Iniciar".
2. **Configuração Inicial:**
   - Desativar "Reprodução automática" se necessário para controle manual.
   - Expandir a sidebar se estiver colapsada (`button[aria-label="Expandir/Colapsar"]`).
3. **Play & Speed:**
   - Clicar no **Play** dentro do iframe.
   - Abrir **Settings** -> **Speed** -> Selecionar **2x**.
4. **Cálculo de Tempo:**
   - Obter duração $T$ da aula (ex: 22:45).
   - Calcular $E = T / 2$ (ex: 11:23).
5. **Espera e Conclusão:**
   - Aguardar $E$.
   - Clicar em **Marcar como assistida** (se não for automático).
   - Clicar em **Próximo conteúdo**.

## 3. Identificação de Status (Módulos Verdes)
* **Módulo Concluído:** O círculo na sidebar ou o checkmark fica verde.
* **CSS Selector:** `div:has(> img[alt*="concluída"])` ou similar.
