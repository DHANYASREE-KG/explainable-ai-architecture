import { AreaMetrics, BasicRequirementsConfig, LandDetails, RoomRequirement } from '../types';

export function calculateRoomArea(length: number, breadth: number): number {
  if (length <= 0 || breadth <= 0) return 0;
  return Math.round(length * breadth * 100) / 100;
}

export function expandRequirementsToSpaces(
  config: BasicRequirementsConfig,
  existingRooms: RoomRequirement[] = []
): RoomRequirement[] {
  const existingMap = new Map<string, RoomRequirement>();
  existingRooms.forEach((r) => existingMap.set(r.id, r));

  const result: RoomRequirement[] = [];

  const getOrCreate = (
    id: string,
    defaultName: string,
    category: RoomRequirement['category'],
    defaultL: number,
    defaultB: number
  ): RoomRequirement => {
    const existing = existingMap.get(id);
    if (existing) {
      return {
        ...existing,
        category,
      };
    }
    const area = calculateRoomArea(defaultL, defaultB);
    return {
      id,
      name: defaultName,
      category,
      count: 1,
      length: defaultL,
      breadth: defaultB,
      area,
      isRequired: true,
    };
  };

  // 1. MAIN LIVING SPACES
  for (let i = 1; i <= (config.halls || 0); i++) {
    const id = `hall-${i}`;
    const name = config.halls === 1 ? 'Living Room' : `Living Room ${i}`;
    result.push(getOrCreate(id, name, 'main', 16, 14));
  }

  for (let i = 1; i <= (config.bedrooms || 0); i++) {
    const id = `bed-${i}`;
    const name = config.bedrooms === 1 ? 'Bedroom' : `Bedroom ${i}`;
    result.push(getOrCreate(id, name, 'main', 12, 12));
  }

  for (let i = 1; i <= (config.kitchens || 0); i++) {
    const id = `kit-${i}`;
    const name = config.kitchens === 1 ? 'Kitchen' : `Kitchen ${i}`;
    result.push(getOrCreate(id, name, 'main', 10, 10));
  }

  for (let i = 1; i <= (config.diningRooms || 0); i++) {
    const id = `din-${i}`;
    const name = config.diningRooms === 1 ? 'Dining Room' : `Dining Room ${i}`;
    result.push(getOrCreate(id, name, 'main', 10, 10));
  }

  for (let i = 1; i <= (config.bathrooms || 0); i++) {
    const id = `bath-${i}`;
    const name = config.bathrooms === 1 ? 'Common Bathroom' : `Common Bathroom ${i}`;
    result.push(getOrCreate(id, name, 'sanitary', 6, 6));
  }

  for (let i = 1; i <= (config.attachedBathrooms || 0); i++) {
    const id = `attached-bath-${i}`;
    const name = config.attachedBathrooms === 1 ? 'Attached Bathroom' : `Attached Bathroom ${i}`;
    result.push(getOrCreate(id, name, 'sanitary', 6, 5));
  }

  // 2. STRUCTURAL & OUTDOOR UTILITIES
  if (config.hasStaircase) {
    result.push(getOrCreate('stair-1', 'Staircase', 'utility', 10, 6));
  }

  if (config.hasParking) {
    result.push(getOrCreate('park-1', 'Parking', 'outdoor', 12, 8));
  }

  if (config.hasGarden) {
    result.push(getOrCreate('garden-1', 'Garden / Lawn', 'outdoor', 15, 10));
  }

  if (config.hasBalcony) {
    result.push(getOrCreate('balcony-1', 'Balcony / Terrace', 'outdoor', 10, 4));
  }

  // 3. OPTIONAL DEDICATED ROOMS
  if (config.optionalRooms) {
    const optionalDefs: {
      key: keyof BasicRequirementsConfig['optionalRooms'];
      id: string;
      name: string;
      l: number;
      b: number;
    }[] = [
      { key: 'prayerRoom', id: 'pray-1', name: 'Pooja Room', l: 6, b: 5 },
      { key: 'studyRoom', id: 'study-1', name: 'Study Room', l: 10, b: 8 },
      { key: 'homeOffice', id: 'office-1', name: 'Home Office', l: 10, b: 10 },
      { key: 'guestRoom', id: 'guest-1', name: 'Guest Room', l: 11, b: 10 },
      { key: 'storeRoom', id: 'store-1', name: 'Store Room', l: 8, b: 6 },
      { key: 'utilityRoom', id: 'util-1', name: 'Utility Area', l: 8, b: 6 },
      { key: 'laundryRoom', id: 'laundry-1', name: 'Laundry Room', l: 8, b: 6 },
    ];

    optionalDefs.forEach((opt) => {
      if (config.optionalRooms[opt.key]) {
        result.push(getOrCreate(opt.id, opt.name, 'optional', opt.l, opt.b));
      }
    });
  }

  return result;
}

export function calculateAreaMetrics(
  land: LandDetails,
  rooms: RoomRequirement[]
): AreaMetrics {
  const totalLandArea =
    land.totalArea > 0
      ? land.totalArea
      : calculateRoomArea(land.length, land.breadth);

  const totalRoomArea = rooms.reduce((sum, room) => {
    return sum + calculateRoomArea(room.length, room.breadth);
  }, 0);

  // Wall allowance estimated at 10% of total room area for structural walls
  const wallPercentage = 10;
  const wallAllowance = Math.round((totalRoomArea * (wallPercentage / 100)) * 100) / 100;

  // Circulation / Passage allowance estimated at 12% for corridors and foyer access
  const circulationPercentage = 12;
  const circulationAllowance = Math.round((totalRoomArea * (circulationPercentage / 100)) * 100) / 100;

  const finalRequiredArea = Math.round((totalRoomArea + wallAllowance + circulationAllowance) * 100) / 100;

  const diff = totalLandArea - finalRequiredArea;
  const remainingArea = diff >= 0 ? Math.round(diff * 100) / 100 : 0;
  const excessArea = diff < 0 ? Math.round(Math.abs(diff) * 100) / 100 : 0;

  return {
    totalLandArea,
    totalRoomArea,
    wallAllowance,
    circulationAllowance,
    finalRequiredArea,
    remainingArea,
    excessArea,
    wallPercentage,
    circulationPercentage,
  };
}
