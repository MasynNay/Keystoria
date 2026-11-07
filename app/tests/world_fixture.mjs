/** Minimal representative public world data for static visual fixtures. */
export const WORLD_RULES = {
  hollow:{
    label:'DREAD',direction:'high',warningText:'THE DARKNESS IS CLOSING IN',
    intro:'Each ritual awakens the house. Banishing a spirit holds the dread at bay.',
    encounter:'THE BLACKENED CHAPEL',encounterIntro:'The chapel has two exits, but both require a ritual. Choose one for your partner to perform.',
    choices:[
      {id:'lantern',label:'LIGHT THE WARDS',description:'Push back the darkness; sacrifice 10 seconds.'},
      {id:'sigil',label:'READ THE FORBIDDEN SIGIL',description:'Dispel more dread, but lose 12 integrity.'},
    ],
  },
};
