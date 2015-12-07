import React, { Component } from 'react';
import { Paragraph } from './Paragraph';

const p1 = "Alice was beginning to get very tired of sitting by her sister on \
the bank, and of having nothing to do. Once or twice she had peeped into the \
book her sister was reading, but it had no pictures or conversations in it, \
\"and what is the use of a book,\" thought Alice, \"without pictures or \
conversations?\""

const header = [
  "THE HISTORY OF HERODOTUS",
  "BOOK I",
  "THE FIRST BOOK OF THE HISTORIES, CALLED CLIO"
]

export class App extends Component {

  constructor() {
    super();
    this.state = {
      poll: true,
      header: 0
    };
    // setInterval(
    //   () => this.setState({ poll: !this.state.poll }),
    //   5000
    // );
    // setInterval(
    //   () => this.setState({ header: (this.state.header + 1) % 3 }),
    //   3000
    // );
  }

  render() {
    return (<div>
      <Paragraph style={{textAlign: 'justify', fontFamily: 'Garamond'}} poll={this.state.poll}>
        Some <b>inline markup</b> to test
      </Paragraph>
    </div>);
  }

}

      // <Paragraph style={{textAlign: 'justify', fontFamily: 'Hoefler Text'}} poll={true}>
      //   This is the Showing forth of the Inquiry of Herodotus of Halicarnassos, to the end that neither the deeds of men may be forgotten by lapse of time, nor the works great and marvellous, which have been produced some by Hellenes and some by Barbarians, may lose their renown; and especially that the causes may be remembered for which these waged war with one another.
      // </Paragraph>
      // <Paragraph style={{textAlign: 'justify', fontFamily: 'Hoefler Text'}} poll={false}>
      //   Those of the Persians who have knowledge of history declare that the Phenicians first began the quarrel. These, they say, came from that which is called the Erythraian Sea to this of ours; and having settled in the land where they continue even now to dwell, set themselves forthwith to make long voyages by sea. And conveying merchandise of Egypt and of Assyria they arrived at other places and also at Argos; now Argos was at that time in all points the first of the States within that land which is now called Hellas;--the Phenicians arrived then at this land of Argos, and began to dispose of their ship's cargo: and on the fifth or sixth day after they had arrived, when their goods had been almost all sold, there came down to the sea a great company of women, and among them the daughter of the king; and her name, as the Hellenes also agree, was Io the daughter of Inachos. These standing near to the stern of the ship were buying of the wares such as pleased them most, when of a sudden the Phenicians, passing the word from one to another, made a rush upon them; and the greater part of the women escaped by flight, but Io and certain others were carried off. So they put them on board their ship, and forthwith departed, sailing away to Egypt.
      // </Paragraph>