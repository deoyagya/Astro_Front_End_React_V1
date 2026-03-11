import TextInput from './TextInput';
import TextArea from './TextArea';
import StarRating from './StarRating';
import Slider from './Slider';
import RadioGroup from './RadioGroup';
import CheckboxGroup from './CheckboxGroup';
import Dropdown from './Dropdown';
import NPSScale from './NPSScale';
import SectionHeader from './SectionHeader';
import Paragraph from './Paragraph';

/** Map question type → renderer component */
export const COMPONENT_MAP = {
  text: TextInput,
  textarea: TextArea,
  star_rating: StarRating,
  slider: Slider,
  radio: RadioGroup,
  checkbox: CheckboxGroup,
  dropdown: Dropdown,
  nps: NPSScale,
  section_header: SectionHeader,
  paragraph: Paragraph,
};

export {
  TextInput, TextArea, StarRating, Slider,
  RadioGroup, CheckboxGroup, Dropdown, NPSScale,
  SectionHeader, Paragraph,
};
