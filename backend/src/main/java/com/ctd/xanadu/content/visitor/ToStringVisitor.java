package com.ctd.xanadu.content.visitor;

import com.ctd.xanadu.content.ImageContent;
import com.ctd.xanadu.content.IntegerContent;
import com.ctd.xanadu.content.TranscludedContent;
import com.ctd.xanadu.content.StringContent;

public class ToStringVisitor implements ContentVisitor<String> {

	@Override
	public String visitStringContent(StringContent c) {
		return c.show();
	}

	@Override
	public String visitTranscludedContent(TranscludedContent c) {
		return c.show().content().accept(this);
	}
	@Override
	public String visitIntegerContent(IntegerContent c) {
		return c.show().toString();
	}
	@Override
	public String visitImageContent(ImageContent c) {
		return "[Image: " + c.show() + "]";
	}

	public static ToStringVisitor get() {
		return new ToStringVisitor();
	}


}
