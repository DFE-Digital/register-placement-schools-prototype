import { FilterToggleButton } from '/public/javascripts/components/filter-toggle-button.js'
import { CheckboxFilter } from '/public/javascripts/components/checkbox-filter.js'

window.GOVUKPrototypeKit.documentReady(() => {
  // -----------------------------------
  // Filter toggle button
  // -----------------------------------
  const filterContainer = document.querySelector('.app-filter-layout__filter')
  const actionBarFilterContainer = document.querySelector('.app-action-bar__filter')
  const filterHeaderActionContainer = document.querySelector('.app-filter__header-action')

  if (filterContainer && actionBarFilterContainer && filterHeaderActionContainer) {
    const filterToggleButton = new FilterToggleButton({
      bigModeMediaQuery: '(min-width: 48.063em)',
      startHidden: false,
      toggleButton: {
        container: actionBarFilterContainer,
        showText: 'Show filter',
        hideText: 'Hide filter',
        classes: 'govuk-button--secondary govuk-!-margin-bottom-3'
      },
      closeButton: {
        container: filterHeaderActionContainer,
        text: 'Close'
      },
      filter: {
        container: filterContainer
      }
    })
    filterToggleButton.init()
  }

  // -----------------------------------
  // Checkbox filters
  // -----------------------------------
  const groupContainer = document.querySelector('#filters-school-group')
  if (groupContainer) {
    const checkboxFilterSchoolGroup = new CheckboxFilter({
      container: groupContainer,
      textBox: { label: 'Search for group' }
    })
    checkboxFilterSchoolGroup.init()
  }

  const typeContainer = document.querySelector('#filters-school-type')
  if (typeContainer) {
    const checkboxFilterSchoolType = new CheckboxFilter({
      container: typeContainer,
      textBox: { label: 'Search for type' }
    })
    checkboxFilterSchoolType.init()
  }

  const phaseContainer = document.querySelector('#filters-school-education-phase')
  if (phaseContainer) {
    const checkboxFilterSchoolEducationPhase = new CheckboxFilter({
      container: phaseContainer,
      textBox: { label: 'Search for education phase' }
    })
    checkboxFilterSchoolEducationPhase.init()
  }
})
