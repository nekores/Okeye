import * as React from 'react';

import Svg, { Path, SvgProps } from 'react-native-svg';

function SvgScan(props: SvgProps) {
  return (
    <Svg viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M10 9H14V7H10V9ZM15 10V14H17V10H15ZM14 15H10V17H14V15ZM9 14V10H7V14H9ZM10 15C9.44772 15 9 14.5523 9 14H7C7 15.6569 8.34315 17 10 17V15ZM15 14C15 14.5523 14.5523 15 14 15V17C15.6569 17 17 15.6569 17 14H15ZM14 9C14.5523 9 15 9.44772 15 10H17C17 8.34315 15.6569 7 14 7V9ZM10 7C8.34315 7 7 8.34315 7 10H9C9 9.44772 9.44772 9 10 9V7ZM5 9V6H3V9H5ZM5 18V15H3V18H5ZM19 15V18H21V15H19ZM19 6V9H21V6H19ZM6 5H9V3H6V5ZM15 5H18V3H15V5ZM9 19H6V21H9V19ZM18 19H15V21H18V19ZM3 18C3 19.6569 4.34315 21 6 21V19C5.44772 19 5 18.5523 5 18H3ZM19 18C19 18.5523 18.5523 19 18 19V21C19.6569 21 21 19.6569 21 18H19ZM21 6C21 4.34315 19.6569 3 18 3V5C18.5523 5 19 5.44772 19 6H21ZM5 6C5 5.44772 5.44772 5 6 5V3C4.34315 3 3 4.34315 3 6H5Z"
        fill="#8C8CA1"
      />
    </Svg>
  );
}

export default SvgScan;
