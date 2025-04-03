import type { Appeal } from '~/types/appeal'

const games = [
  'Counter-Strike 2',
  'Dota 2',
  'PUBG: BATTLEGROUNDS',
  'Apex Legends',
  'Call of Duty: Warzone',
  'Valorant',
  'League of Legends',
  'Overwatch 2',
  'Fortnite',
  'Rainbow Six Siege'
]

const itemTypes = ['Skins', 'Equipment', 'Characters', 'Weapons', 'Emotes']

const skinNames = {
  'Counter-Strike 2': ['Dragon Lore AWP', 'Asiimov M4A4', 'Fade Knife', 'Howl M4A4', 'Fire Serpent AK-47'],
  'Dota 2': ['Arcana Lina', 'Dragonclaw Hook', 'Golden Baby Roshan', 'Ethereal Flames Courier', 'Tempest Helm'],
  'PUBG': ['Golden Plate Kar98k', 'Leopard Print M416', 'Desert Digital AKM', 'Arctic Ghillie Suit', 'Red Line Vector'],
  'Apex Legends': ['Wraith Kunai', 'Bloodhound Raven', 'Pathfinder Boxing Gloves', 'Lifeline Shock Sticks', 'Octane Butterfly Knife'],
  'Valorant': ['Prime Vandal', 'Elder Flame Operator', 'Glitchpop Dagger', 'Reaver Sheriff', 'Ion Phantom']
}

function generateMockAppeals(total: number = 50): Appeal[] {
  const appeals: Appeal[] = []
  let id = 1

  // Create game folders
  for (let i = 0; i < games.length; i++) {
    const gameFolder: Appeal = {
      id: id++,
      title: games[i],
      description: `All appeals related to ${games[i]}`,
      parentId: null,
      children: [],
      isFolder: true
    }

    // Create category folders for each game
    itemTypes.forEach((itemType, typeIndex) => {
      const categoryFolder: Appeal = {
        id: id++,
        title: itemType,
        description: `${itemType} for ${games[i]}`,
        parentId: gameFolder.id,
        children: [],
        isFolder: true
      }

      // Add specific items for each category
      const items = skinNames[games[i] as keyof typeof skinNames] ||
                   [`${itemType} Item 1`, `${itemType} Item 2`, `${itemType} Item 3`]

      items.forEach((item, itemIndex) => {
        const itemAppeal: Appeal = {
          id: id++,
          title: item,
          description: `Appeal for ${item} in ${games[i]}`,
          parentId: categoryFolder.id,
          children: [],
          isFolder: false
        }
        categoryFolder.children.push(itemAppeal)
      })

      gameFolder.children.push(categoryFolder)
    })

    appeals.push(gameFolder)
  }

  return appeals
}

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const page = Number(query.page) || 1
  const pageSize = Number(query.pageSize) || 10

  const allAppeals = generateMockAppeals()

  // Flatten the tree structure for pagination
  const flattenedAppeals = allAppeals.reduce((acc: Appeal[], appeal) => {
    acc.push(appeal)
    if (appeal.children?.length) {
      acc.push(...appeal.children)
    }
    return acc
  }, [])

  const totalAppeals = flattenedAppeals.length
  const totalPages = Math.ceil(totalAppeals / pageSize)

  const start = (page - 1) * pageSize
  const end = start + pageSize
  const paginatedAppeals = flattenedAppeals.slice(start, end)

  // Reconstruct the tree structure for the current page
  const appeals = allAppeals.filter(appeal => {
    // Include if the appeal is in the current page
    if (paginatedAppeals.some(a => a.id === appeal.id)) return true
    // Include if any of its children are in the current page
    if (appeal.children?.some(child => paginatedAppeals.some(a => a.id === child.id))) return true
    return false
  })

  return {
    appeals,
    page,
    totalPages,
    totalAppeals
  }
})
